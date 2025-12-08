import { db } from '../config/firebase.js';
import { COLLECTIONS, ISSUE_STATUS, USER_ROLES } from '../config/constants.js';
import { Issue } from '../models/Issue.js';
import { generateTrackingNumber } from '../utils/helpers.js';
import { NotificationService } from './notificationService.js';

export class IssueService {
  static async getIssueById(issueId) {
    const issueDoc = await db.collection(COLLECTIONS.ISSUES).doc(issueId).get();
    if (!issueDoc.exists) {
      throw new Error('Issue not found');
    }
    return { id: issueDoc.id, ...issueDoc.data() };
  }

  static async getIssues(filters = {}, pagination = {}) {
    // Helper function to build query with filters
    const buildQuery = (includeOrderBy = true) => {
      let query = db.collection(COLLECTIONS.ISSUES);
      
      // Apply filters
      if (filters.studentId) query = query.where('studentId', '==', filters.studentId);
      if (filters.hostelId) query = query.where('hostelId', '==', filters.hostelId);
      if (filters.assignedWorkerId) query = query.where('assignedWorkerId', '==', filters.assignedWorkerId);
      if (filters.status) query = query.where('status', '==', filters.status);
      if (filters.type) query = query.where('type', '==', filters.type);
      if (filters.urgency) query = query.where('urgency', '==', filters.urgency);
      
      // Try to order by createdAt if requested
      if (includeOrderBy) {
        query = query.orderBy('createdAt', 'desc');
      }
      
      // Apply pagination (only if we have orderBy, otherwise we'll limit after sorting)
      if (includeOrderBy && pagination.limit) {
        query = query.limit(pagination.limit);
      }
      
      return query;
    };
    
    // Helper function to sort issues by createdAt
    const sortIssues = (issues) => {
      return issues.sort((a, b) => {
        const aTime = a.createdAt 
          ? (typeof a.createdAt === 'string' 
              ? new Date(a.createdAt).getTime() 
              : (a.createdAt.toMillis?.() || a.createdAt._seconds * 1000 || 0))
          : 0;
        const bTime = b.createdAt 
          ? (typeof b.createdAt === 'string' 
              ? new Date(b.createdAt).getTime() 
              : (b.createdAt.toMillis?.() || b.createdAt._seconds * 1000 || 0))
          : 0;
        return bTime - aTime; // Descending order (newest first)
      });
    };
    
    try {
      // First, try with orderBy
      const query = buildQuery(true);
      const snapshot = await query.get();
      let issues = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      
      // Always sort in memory as backup (handles string dates properly)
      issues = sortIssues(issues);
      
      return issues;
    } catch (error) {
      console.error('Error in IssueService.getIssues:', error);
      console.error('Filters:', filters);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // If it's a Firestore index error (code 9), retry without orderBy
      if (error.code === 9 || error.message?.includes('index') || error.message?.includes('requires an index')) {
        console.log('Retrying query without orderBy due to index requirement...');
        try {
          // Build query without orderBy
          const query = buildQuery(false);
          const snapshot = await query.get();
          let issues = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
          
          // Sort by createdAt in memory
          issues = sortIssues(issues);
          
          // Apply limit after sorting
          if (pagination.limit) {
            issues = issues.slice(0, pagination.limit);
          }
          
          return issues;
        } catch (retryError) {
          console.error('Retry also failed:', retryError);
          throw new Error(`Database query failed: ${retryError.message}. Please check your Firestore configuration.`);
        }
      }
      
      // For any other error, throw it
      throw error;
    }
  }

  static async createIssue(issueData) {
    const trackingNumber = await generateTrackingNumber();
    // Ensure createdBy is set to studentId
    const issue = new Issue({ 
      ...issueData, 
      createdBy: issueData.createdBy || issueData.studentId,
      trackingNumber, 
      status: ISSUE_STATUS.PENDING 
    });
    const docRef = await db.collection(COLLECTIONS.ISSUES).add(issue.toFirestore());
    const hostel = await db.collection(COLLECTIONS.HOSTELS).doc(issueData.hostelId).get();
    if (hostel.exists && hostel.data().adminId) {
      await NotificationService.createNotification({
        userId: hostel.data().adminId,
        type: 'new_issue',
        message: `New ${issueData.type} issue reported: ${issueData.title}`,
        relatedIssueId: docRef.id,
      });
    }
    return { id: docRef.id, ...issue.toFirestore() };
  }

  static async updateIssue(issueId, updateData) {
    const issueDoc = await db.collection(COLLECTIONS.ISSUES).doc(issueId);
    const existingIssue = await issueDoc.get();
    if (!existingIssue.exists) {
      throw new Error('Issue not found');
    }
    const updatedData = { ...existingIssue.data(), ...updateData, updatedAt: new Date().toISOString() };
    await issueDoc.update(updatedData);
    return { id: issueId, ...updatedData };
  }

  static async assignWorker(issueId, workerId, scheduledTime = null) {
    const issue = await this.getIssueById(issueId);
    if (issue.status !== ISSUE_STATUS.PENDING) {
      throw new Error('Issue is not in pending status');
    }
    const { UserService } = await import('./userService.js');
    const worker = await UserService.getUserById(workerId);
    if (worker.role !== USER_ROLES.WORKER) {
      throw new Error('User is not a worker');
    }
    if (!worker.skills || !worker.skills.includes(issue.type)) {
      throw new Error('Worker does not have required skills for this issue type');
    }
    if (!worker.hostels || !worker.hostels.includes(issue.hostelId)) {
      throw new Error('Worker is not assigned to this hostel');
    }
    const updateData = {
      assignedWorkerId: workerId,
      status: ISSUE_STATUS.ASSIGNED,
      updatedAt: new Date().toISOString(),
    };
    if (scheduledTime) updateData.scheduledTime = scheduledTime;
    await this.updateIssue(issueId, updateData);
    await NotificationService.createNotification({
      userId: workerId,
      type: 'issue_assigned',
      message: `New ${issue.urgency} ${issue.type} job assigned: ${issue.title} at ${issue.hostelId}`,
      relatedIssueId: issueId,
    });
    await NotificationService.createNotification({
      userId: issue.studentId,
      type: 'issue_assigned',
      message: `Worker ${worker.name} has been assigned to fix your issue`,
      relatedIssueId: issueId,
      relatedWorkerId: workerId,
    });
    return this.getIssueById(issueId);
  }

  static async updateStatus(issueId, status, workerId = null) {
    const issue = await this.getIssueById(issueId);
    const validStatuses = Object.values(ISSUE_STATUS);
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(', ')}`);
    }
    if ((status === ISSUE_STATUS.IN_PROGRESS || status === ISSUE_STATUS.COMPLETED) && workerId) {
      if (issue.assignedWorkerId !== workerId) {
        throw new Error('Only assigned worker can update status');
      }
    }
    const updateData = { status, updatedAt: new Date().toISOString() };
    if (status === ISSUE_STATUS.COMPLETED) {
      updateData.completedAt = new Date().toISOString();
    }
    await this.updateIssue(issueId, updateData);
    if (status === ISSUE_STATUS.IN_PROGRESS) {
      // Notify the student/user who created the issue
      await NotificationService.createNotification({
        userId: issue.createdBy || issue.studentId,
        type: 'work_started',
        message: 'Worker has started working on your issue',
        relatedIssueId: issueId,
        relatedWorkerId: issue.assignedWorkerId,
      });
      // Also notify the admin of the hostel
      const hostel = await db.collection(COLLECTIONS.HOSTELS).doc(issue.hostelId).get();
      if (hostel.exists && hostel.data().adminId) {
        await NotificationService.createNotification({
          userId: hostel.data().adminId,
          type: 'work_started',
          message: `Work has started on issue: ${issue.title}`,
          relatedIssueId: issueId,
          relatedWorkerId: issue.assignedWorkerId,
        });
      }
    } else if (status === ISSUE_STATUS.COMPLETED) {
      await NotificationService.createNotification({
        userId: issue.studentId,
        type: 'work_completed',
        message: 'Worker has completed the job. Please confirm if the issue is fixed.',
        relatedIssueId: issueId,
        relatedWorkerId: issue.assignedWorkerId,
      });
    }
    return this.getIssueById(issueId);
  }

  static async confirmFix(issueId, isFixed) {
    const issue = await this.getIssueById(issueId);
    if (issue.status !== ISSUE_STATUS.COMPLETED) {
      throw new Error('Issue must be completed before confirmation');
    }
    if (isFixed) {
      await this.updateIssue(issueId, { status: ISSUE_STATUS.CLOSED, updatedAt: new Date().toISOString() });
      await NotificationService.createNotification({
        userId: issue.assignedWorkerId,
        type: 'issue_confirmed',
        message: 'Student confirmed the issue is fixed',
        relatedIssueId: issueId,
      });
    } else {
      await this.updateIssue(issueId, { status: ISSUE_STATUS.IN_PROGRESS, updatedAt: new Date().toISOString() });
      await NotificationService.createNotification({
        userId: issue.assignedWorkerId,
        type: 'issue_reopened',
        message: 'Student reported issue is not fixed. Please continue working.',
        relatedIssueId: issueId,
      });
    }
    return this.getIssueById(issueId);
  }

  static async addWorkerUpdate(issueId, workerId, notes = null, photos = []) {
    const issue = await this.getIssueById(issueId);
    if (issue.assignedWorkerId !== workerId) {
      throw new Error('Only assigned worker can add updates');
    }
    const updateData = { updatedAt: new Date().toISOString() };
    if (notes) updateData.workerNotes = notes;
    if (photos && photos.length > 0) {
      updateData.workerPhotos = [...(issue.workerPhotos || []), ...photos];
    }
    await this.updateIssue(issueId, updateData);
    return this.getIssueById(issueId);
  }

  // Removed getUrgentIssues - urgency levels no longer exist
}


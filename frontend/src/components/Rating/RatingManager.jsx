import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import issueService from '../../services/issueService';
import RatingPopup from '../UI/RatingPopup';

const RatingManager = () => {
  const { userData } = useAuth();
  const [unratedIssues, setUnratedIssues] = useState([]);
  const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
  const lastUserIdRef = useRef(null);

  // Check for unrated issues when student logs in
  useEffect(() => {
    if (!userData || userData.role !== 'student') {
      // Reset when user logs out or is not a student
      setUnratedIssues([]);
      setCurrentIssueIndex(0);
      lastUserIdRef.current = null;
      return;
    }

    const userId = userData.id || userData.uid;
    
    // Only check if this is a new user login (user changed)
    if (lastUserIdRef.current === userId) {
      return;
    }

    lastUserIdRef.current = userId;

    const checkUnratedIssues = async () => {
      try {
        const issues = await issueService.getUnratedIssues();
        if (issues && issues.length > 0) {
          setUnratedIssues(issues);
          setCurrentIssueIndex(0);
        } else {
          setUnratedIssues([]);
          setCurrentIssueIndex(0);
        }
      } catch (error) {
        console.error('Error checking unrated issues:', error);
        setUnratedIssues([]);
      }
    };

    // Small delay to ensure user is fully logged in
    const timer = setTimeout(() => {
      checkUnratedIssues();
    }, 1500);

    return () => clearTimeout(timer);
  }, [userData]);

  const handleRatingSubmitted = (issueId) => {
    // Remove the rated issue from the list
    setUnratedIssues((prev) => prev.filter((issue) => issue.id !== issueId));
    
    // Move to next issue if available
    if (currentIssueIndex < unratedIssues.length - 1) {
      setCurrentIssueIndex((prev) => prev + 1);
    } else {
      setCurrentIssueIndex(0);
    }
  };

  const handleClose = () => {
    // Move to next issue if available
    if (currentIssueIndex < unratedIssues.length - 1) {
      setCurrentIssueIndex((prev) => prev + 1);
    } else {
      // No more issues, clear the list
      setUnratedIssues([]);
      setCurrentIssueIndex(0);
    }
  };

  // Only show for students with unrated issues
  if (!userData || userData.role !== 'student' || unratedIssues.length === 0) {
    return null;
  }

  const currentIssue = unratedIssues[currentIssueIndex];

  if (!currentIssue) {
    return null;
  }

  return (
    <RatingPopup
      issue={currentIssue}
      onClose={handleClose}
      onRatingSubmitted={handleRatingSubmitted}
    />
  );
};

export default RatingManager;


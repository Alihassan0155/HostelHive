// src/pages/Student/RecentIssuesList.jsx
import React from "react";
import IssueCard from "../../components/Issue/IssueCard";

const RecentIssuesList = ({ issues = [] }) => {
  if (!issues || issues.length === 0) {
    return <div className="p-6 text-center text-gray-500">No recent reports found.</div>;
  }

  return (
    <div className="grid gap-3">
      {issues.map((issue) => (
        <IssueCard key={issue.id} issue={issue} />
      ))}
    </div>
  );
};

export { RecentIssuesList };
export default RecentIssuesList;

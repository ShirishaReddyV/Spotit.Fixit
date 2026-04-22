// src/services/api.js

const PYTHON_AI_BASE_URL = 'http://localhost:8000';
const JAVA_CORE_BASE_URL = 'http://localhost:8080';

export const AI_SERVICE = {
  async categorizeIssue(descriptionText) {
    try {
      const response = await fetch(`${PYTHON_AI_BASE_URL}/api/ai/route-ticket`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descriptionText }),
      });
      if (!response.ok) throw new Error('AI Service offline');
      return await response.json();
    } catch (error) {
      console.error("AI Routing Error:", error);
      return null;
    }
  },

  async checkDuplicate(lat, lng, category = null, radiusKm = 0.15) {
    try {
      const response = await fetch(`${PYTHON_AI_BASE_URL}/api/ai/check-duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat, lng, category, radius_km: radiusKm }),
      });
      if (!response.ok) throw new Error('Duplicate check failed');
      return await response.json();
    } catch (error) {
      console.error("Duplicate Check Error:", error);
      return { duplicate_found: false };
    }
  }
};

export const CORE_SERVICE = {
  async submitReport(issueData) {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/issues/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(issueData),
      });
      if (!response.ok) throw new Error('Database connection failed');
      return await response.json(); 
    } catch (error) { return null; }
  },
  
  async getAllReports() {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/issues/all`);
      if (!response.ok) throw new Error('Fetch failed');
      return await response.json();
    } catch (error) { return []; }
  },

  async getUserReports(username) {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/issues/user/${username}`);
      if (!response.ok) throw new Error('Fetch failed');
      return await response.json();
    } catch (error) { return []; }
  },

  async updateIssueStatus(id, newStatus) {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/issues/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Update failed');
      return await response.json();
    } catch (error) { return null; }
  },

  async markAsFraud(id, reason) {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/issues/${id}/fraud`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: reason }),
      });
      if (!response.ok) throw new Error('Fraud update failed');
      return await response.json();
    } catch (error) { return null; }
  },

  // NEW: Admin uploading proof of work
  async resolveIssueWithProof(id, imageBase64) {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/issues/${id}/resolve-proof`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resolutionImage: imageBase64 }),
      });
      if (!response.ok) throw new Error('Resolution failed');
      return await response.json();
    } catch (error) { return null; }
  },

  // NEW: Upvote an existing issue (increments persistent DB counter)
  async upvoteIssue(id, username) {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/issues/${id}/upvote`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(username ? { username } : {}),
      });
      if (!response.ok) throw new Error('Upvote failed');
      return await response.json();
    } catch (error) { return null; }
  },

  // NEW: Trigger resolution confirmation emails
  async dispatchConfirmations(id) {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/confirm/${id}/send`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Dispatch failed');
      return await response.json();
    } catch (error) { return null; }
  }
};

export const AUTH_SERVICE = {
  // UPGRADED: Now accepts a full object payload (including Aadhaar)
  async register(userData) {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) throw new Error(await response.text());
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async login(username, password, role) {
    try {
      const response = await fetch(`${JAVA_CORE_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, role }),
      });
      if (!response.ok) throw new Error(await response.text());
      return { success: true, data: await response.json() };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};
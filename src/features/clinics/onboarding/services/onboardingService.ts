export const onboardingService = {
  // Fetch onboarding draft data from PostgreSQL API
  async getDraft(clinicId: string) {
    const res = await fetch(`/api/onboarding/draft?clinicId=${clinicId}`);
    if (!res.ok) {
      throw new Error('Failed to retrieve onboarding draft');
    }
    return res.json();
  },

  // Save onboarding step progress to PostgreSQL API
  async saveDraft(clinicId: string, stepData: Record<string, unknown>) {
    const res = await fetch('/api/onboarding/draft', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId, stepData }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to auto-save onboarding progress');
    }

    return res.json();
  },

  // Securely upload document attachment (e.g. Medical License)
  async uploadDoc(clinicId: string, documentType: string, file: File) {
    const formData = new FormData();
    formData.append('clinicId', clinicId);
    formData.append('documentType', documentType);
    formData.append('file', file);

    const res = await fetch('/api/onboarding/upload', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to upload document');
    }

    return res.json();
  },

  // Delete uploaded document
  async deleteDoc(clinicId: string, documentId: string) {
    const res = await fetch(`/api/onboarding/upload?clinicId=${clinicId}&documentId=${documentId}`, {
      method: 'DELETE',
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete document');
    }

    return res.json();
  },

  // Submit onboarding for Super Admin review
  async submitForReview(clinicId: string) {
    const res = await fetch('/api/onboarding/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId, action: 'SUBMIT' }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to submit application for review');
    }

    return res.json();
  },

  // Approve Clinic Review (Super Admin action)
  async approveReview(clinicId: string, adminId: string, notes?: string) {
    const res = await fetch('/api/onboarding/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId, action: 'APPROVE', adminId, notes }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to approve application');
    }

    return res.json();
  },

  // Reject Clinic Review (Super Admin action)
  async rejectReview(clinicId: string, adminId: string, reason: string, notes?: string) {
    const res = await fetch('/api/onboarding/review', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clinicId, action: 'REJECT', adminId, reason, notes }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to reject application');
    }

    return res.json();
  }
};
export default onboardingService;

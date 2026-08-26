/**
 * Shared DTO Helpers for API routes
 */

export function formatDocumentDto<T extends { id: string }>(doc: T) {
  return {
    ...doc,
    fileUrl: `/api/files/document?documentId=${doc.id}`,
  };
}

export function formatDocumentDtos<T extends { id: string }>(docs: T[]) {
  return docs.map(formatDocumentDto);
}

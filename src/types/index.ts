export interface JiraAccount {
  id: string;
  email: string;
  domain: string;
  // Token is NOT stored here in state for security reasons, or kept in memory only?
  // If we want to keep it in memory for the session:
  token?: string;
}

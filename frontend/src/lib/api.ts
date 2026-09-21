const API_URL = "http://127.0.0.1:8000";

export async function getChildren(token: string) {
  const response = await fetch(`${API_URL}/children/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch children");
  }

  return response.json();
}
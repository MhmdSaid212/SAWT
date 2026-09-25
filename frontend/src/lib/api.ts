const API_URL = "http://127.0.0.1:8000";

export type ChildAssignment = {
  id: string;
  child_id: string;
  exercise_id: string;
  assigned_by: string;
  assigned_at: string;
  due_date: string;
  status: string;
  best_score?: number;
  attempt_count?: number;
  completed_at?: string | null;
};

export type ChildAssignmentsResponse = {
  assignments: ChildAssignment[];
  attempts_count: number;
};

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

export async function getChild(
  childId: string,
  token: string
) {
  const response = await fetch(
    `${API_URL}/children/${childId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch child");
  }

  return response.json();
}

export async function getExercises(token: string) {
  const response = await fetch(`${API_URL}/exercises/`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch exercises");
  }

  return response.json();
}

export async function getChildAssignments(
  childId: string,
  token: string
): Promise<ChildAssignmentsResponse> {
  const response = await fetch(
    `${API_URL}/assignments/child/${childId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch assignments");
  }

  return response.json();
}

export async function createAttempt(
  childId: string,
  exerciseId: string,
  assignmentId: string | null,
  token: string
) {
  const response = await fetch(`${API_URL}/attempts/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      child_id: childId,
      exercise_id: exerciseId,
      assignment_id: assignmentId,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to create practice attempt");
  }

  return response.json();
}

export async function uploadAttemptAudio(
  attemptId: string,
  audioBlob: Blob,
  token: string
) {
  const formData = new FormData();

  formData.append(
    "audio",
    audioBlob,
    "practice-recording.webm"
  );

  const response = await fetch(
    `${API_URL}/attempts/${attemptId}/audio`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    }
  );

  if (!response.ok) {
    throw new Error("Failed to upload audio");
  }

  return response.json();
}

export async function getParentSummary(token: string) {
  const response = await fetch(
    `${API_URL}/attempts/parent/summary`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch parent summary");
  }

  return response.json();
}


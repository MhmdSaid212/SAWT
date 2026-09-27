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


export type ParentChildAttempt = {
  id: string;
  child_id: string;
  exercise_id: string;
  assignment_id?: string | null;

  exercise: {
    id: string;
    title?: string;
    target_word?: string;
  } | null;

  transcript: string | null;
  ai_score: number | null;
  ai_feedback: string | null;
  therapist_feedback: string | null;

  recording: {
    id: string;
    file_url: string;
    duration_seconds: number;
    created_at: string | null;
  } | null;

  ai_analysis: {
    id: string;
    target_phoneme_id: string | null;
    estimated_phoneme_id: string | null;
    confidence: number | null;
    pronunciation_score: number | null;
    details: string | null;
  }[];

  created_at: string | null;
};

export type ParentChildAttemptsResponse = {
  child: {
    id: string;
    name: string;
  };

  attempts: ParentChildAttempt[];

  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
  };
};

export async function getParentChildAttempts(
  childId: string,
  token: string,
  page = 1,
  limit = 5
): Promise<ParentChildAttemptsResponse> {
  const response = await fetch(
    `${API_URL}/attempts/parent/child/${childId}?page=${page}&limit=${limit}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch child attempts");
  }

  return response.json();
}



export async function getParentActivity(token: string) {
  const response = await fetch(
    `${API_URL}/activity/parent`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch parent activity");
  }

  return response.json();
}





export async function getMyProfile(token: string) {
  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch profile");
  }

  return response.json();
}

export async function updateMyProfile(
  data: {
    name?: string;
    email?: string;
    password?: string;
  },
  token: string
) {
  const response = await fetch(
    `${API_URL}/auth/me`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Failed to update profile"
    );
  }

  return response.json();
}



export async function updateChild(
  childId: string,
  data: {
    full_name?: string;
    date_of_birth?: string;
    language_preference?: string;
    avatar_url?: string | null;
  },
  token: string
) {
  const response = await fetch(
    `${API_URL}/children/${childId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Failed to update child"
    );
  }

  return response.json();
}

export async function deleteChild(
  childId: string,
  token: string
) {
  const response = await fetch(
    `${API_URL}/children/${childId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);

    throw new Error(
      errorData?.detail || "Failed to delete child"
    );
  }

  return response.json();
}
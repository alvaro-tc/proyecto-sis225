const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:8000"; // default to http://localhost:8000

function authHeaders() {
  let token = localStorage.getItem("token") || null;
  // older code stores the full user JSON in localStorage under 'user' with a token property
  if (!token) {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u && (u.token || u.access)) token = u.token || u.access;
      } catch (e) {
        // ignore parse errors
      }
    }
  }

  const headers = { "Content-Type": "application/json" };
  if (token) {
    // normalize token: remove surrounding quotes and whitespace
    try {
      token = String(token).trim();
      if (token.startsWith('"') && token.endsWith('"')) token = token.slice(1, -1);
      // build explicit Authorization header
      const authHeader = `Bearer ${token}`;
      headers["Authorization"] = authHeader;
    } catch (e) {
      // ignore logging errors
    }
  }
  return headers;
}

async function handleResponse(res) {
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw data;
  return data;
}

async function list(resource) {
  const url = `${API_BASE}/api/clinic/${resource}`;
  const headers = authHeaders();
  const res = await fetch(url, {
    method: "GET",
    headers,
  });
  return handleResponse(res);
}

async function retrieve(resource, id) {
  const url = `${API_BASE}/api/clinic/${resource}/${id}`;
  const headers = authHeaders();
  const res = await fetch(url, {
    method: "GET",
    headers,
  });
  return handleResponse(res);
}

async function create(resource, payload) {
  const url = `${API_BASE}/api/clinic/${resource}`;
  const headers = authHeaders();
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

async function update(resource, id, payload) {
  const url = `${API_BASE}/api/clinic/${resource}/${id}`;
  const headers = authHeaders();
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

async function partial(resource, id, payload) {
  const url = `${API_BASE}/api/clinic/${resource}/${id}`;
  const headers = authHeaders();
  const res = await fetch(url, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
  });
  return handleResponse(res);
}

async function remove(resource, id) {
  const url = `${API_BASE}/api/clinic/${resource}/${id}`;
  const headers = authHeaders();
  const res = await fetch(url, {
    method: "DELETE",
    headers,
  });
  return handleResponse(res);
}

export default {
  list,
  retrieve,
  create,
  update,
  partial,
  remove,
};

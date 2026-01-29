import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

export async function getConfig() {
  const { data } = await api.get('/config');
  return data;
}

export async function getProjects() {
  const { data } = await api.get('/projects');
  return data;
}

export async function createProject(project) {
  const { data } = await api.post('/projects', project);
  return data;
}

export async function deleteProject(id) {
  await api.delete(`/projects/${id}`);
}

export async function getProjectStats(id) {
  const { data } = await api.get(`/projects/${id}/stats`);
  return data;
}

import { apiClient } from '../config/api';

export const taxonomyApi = {
  getSubjects: async () => {
    const res = await apiClient.get('/subjects');
    return res.data.data;
  },
  getTopicsBySubject: async (subjectId: string) => {
    const res = await apiClient.get(`/topics/subject/${subjectId}`);
    return res.data.data;
  },
  getSubTopicsByTopic: async (topicId: string) => {
    const res = await apiClient.get(`/sub-topics/topic/${topicId}`);
    return res.data.data;
  },
  getMultiSubTopics: async (topicIds: string[]) => {
    if (!topicIds || topicIds.length === 0) return [];
    const res = await apiClient.post('/sub-topics/multi-topics', { topicIds });
    return res.data.data || [];
  },
};

export const testApi = {
  getTests: async () => {
    const res = await apiClient.get('/tests');
    return res.data.data;
  },
  getTestById: async (id: string) => {
    const res = await apiClient.get(`/tests/${id}`);
    return res.data.data;
  },
  createTest: async (payload: any) => {
    const res = await apiClient.post('/tests', payload);
    return res.data;
  },
  updateTest: async (id: string, payload: any) => {
    const res = await apiClient.put(`/tests/${id}`, payload);
    return res.data;
  },
  deleteTest: async (id: string) => {
    const res = await apiClient.delete(`/tests/${id}`);
    return res.data;
  },
};

export const questionApi = {
  bulkCreate: async (questions: any[]) => {
    const res = await apiClient.post('/questions/bulk', { questions });
    return res.data;
  },
  fetchBulk: async (questionIds: string[]) => {
    const res = await apiClient.post('/questions/fetchBulk', { question_ids: questionIds });
    return res.data.data || res.data || [];
  },
};
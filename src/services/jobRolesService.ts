import api from '@/lib/api';

export interface JobRole {
  id: string;
  name: string;
  key: string;
  icon: string;
  is_deletable: boolean;
  created_at: string;
}

export interface CreateJobRolePayload {
  name: string;
  icon: string;
}

export interface UpdateJobRolePayload {
  name?: string;
  icon?: string;
}

const jobRolesService = {
  async listRoles(organizationId: string): Promise<JobRole[]> {
    const response = await api.get(`/api/organizations/${organizationId}/job-roles`);
    return response.data.data.roles as JobRole[];
  },

  async createRole(organizationId: string, payload: CreateJobRolePayload): Promise<JobRole> {
    const response = await api.post(`/api/organizations/${organizationId}/job-roles`, payload);
    return response.data.data.role as JobRole;
  },

  async updateRole(
    organizationId: string,
    roleId: string,
    payload: UpdateJobRolePayload
  ): Promise<JobRole> {
    const response = await api.put(
      `/api/organizations/${organizationId}/job-roles/${roleId}`,
      payload
    );
    return response.data.data.role as JobRole;
  },

  async deleteRole(organizationId: string, roleId: string): Promise<void> {
    await api.delete(`/api/organizations/${organizationId}/job-roles/${roleId}`);
  },
};

export default jobRolesService;

// services/InvitationService.ts
import axios from 'axios';

export interface InvitationResult {
    success: boolean;
    message?: string;
    error?: string;
    data?: any;
}

export interface InvitationLinkOptions {
    pizarraId: string | number;
    roomId?: string;
    expiresIn?: number; // Expiration time in hours
    includeTimestamp?: boolean;
}

/**
 * Service for managing invitations to pizarras
 * This service provides functionality for generating invitation links,
 * sending invitations, and managing collaborators without requiring
 * a full collaboration setup.
 */
export class InvitationService {
    /**
     * Generates an invitation link for a pizarra
     * @param options Options for generating the link
     * @returns The generated invitation link
     */
    static generateInvitationLink(options: InvitationLinkOptions): string {
        const { pizarraId, roomId, includeTimestamp = true } = options;

        // Create a base URL (use the current origin)
        const baseUrl = window.location.origin;

        // Create a link with pizarraId and roomId (if provided)
        let invitationLink = `${baseUrl}/pizarra_unificada/join?pizarraId=${pizarraId}`;

        // Add roomId if provided
        if (roomId) {
            invitationLink += `&roomId=${roomId}`;
        }

        // Add a timestamp to make the link unique
        if (includeTimestamp) {
            const timestamp = new Date().getTime();
            invitationLink += `&t=${timestamp}`;
        }

        return invitationLink;
    }

    /**
     * Sends an invitation to a user via email
     * @param email Email of the user to invite
     * @param pizarraId ID of the pizarra to invite to
     * @returns Result of the operation
     */
    static async sendInvitation(email: string, pizarraId: string | number): Promise<InvitationResult> {
        try {
            const response = await axios.post('/api/invitations/send', {
                email,
                pizarra_id: pizarraId
            });

            return {
                success: true,
                message: 'Invitación enviada exitosamente',
                data: response.data
            };
        } catch (error: any) {
            console.error('Error sending invitation:', error);

            return {
                success: false,
                error: error.response?.data?.message || 'Error al enviar la invitación'
            };
        }
    }

    /**
     * Accepts an invitation
     * @param invitationId ID of the invitation to accept
     * @returns Result of the operation
     */
    static async acceptInvitation(invitationId: string | number): Promise<InvitationResult> {
        try {
            const response = await axios.post(`/api/invitations/${invitationId}/accept`);

            return {
                success: true,
                message: 'Invitación aceptada exitosamente',
                data: response.data
            };
        } catch (error: any) {
            console.error('Error accepting invitation:', error);

            return {
                success: false,
                error: error.response?.data?.message || 'Error al aceptar la invitación'
            };
        }
    }

    /**
     * Rejects an invitation
     * @param invitationId ID of the invitation to reject
     * @returns Result of the operation
     */
    static async rejectInvitation(invitationId: string | number): Promise<InvitationResult> {
        try {
            const response = await axios.post(`/api/invitations/${invitationId}/reject`);

            return {
                success: true,
                message: 'Invitación rechazada exitosamente',
                data: response.data
            };
        } catch (error: any) {
            console.error('Error rejecting invitation:', error);

            return {
                success: false,
                error: error.response?.data?.message || 'Error al rechazar la invitación'
            };
        }
    }

    /**
     * Gets all invitations for the current user
     * @returns Result of the operation with invitations data
     */
    static async getInvitations(): Promise<InvitationResult> {
        try {
            const response = await axios.get('/api/invitations');

            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            console.error('Error getting invitations:', error);

            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener las invitaciones'
            };
        }
    }

    /**
     * Gets all collaborators for a pizarra
     * @param pizarraId ID of the pizarra
     * @returns Result of the operation with collaborators data
     */
    static async getCollaborators(pizarraId: string | number): Promise<InvitationResult> {
        try {
            const response = await axios.get(`/api/pizarra_unificada/${pizarraId}/collaborators`);

            return {
                success: true,
                data: response.data
            };
        } catch (error: any) {
            console.error('Error getting collaborators:', error);

            return {
                success: false,
                error: error.response?.data?.message || 'Error al obtener los colaboradores'
            };
        }
    }

    /**
     * Adds a collaborator to a pizarra
     * @param pizarraId ID of the pizarra
     * @param email Email of the user to add as collaborator
     * @returns Result of the operation
     */
    static async addCollaborator(pizarraId: string | number, email: string): Promise<InvitationResult> {
        try {
            const response = await axios.post(`/api/pizarra_unificada/${pizarraId}/collaborators`, {
                email
            });

            return {
                success: true,
                message: 'Colaborador agregado exitosamente',
                data: response.data
            };
        } catch (error: any) {
            console.error('Error adding collaborator:', error);

            return {
                success: false,
                error: error.response?.data?.message || 'Error al agregar colaborador'
            };
        }
    }

    /**
     * Removes a collaborator from a pizarra
     * @param pizarraId ID of the pizarra
     * @param userId ID of the user to remove
     * @returns Result of the operation
     */
    static async removeCollaborator(pizarraId: string | number, userId: string | number): Promise<InvitationResult> {
        try {
            const response = await axios.delete(`/api/pizarra_unificada/${pizarraId}/collaborators/${userId}`);

            return {
                success: true,
                message: 'Colaborador eliminado exitosamente',
                data: response.data
            };
        } catch (error: any) {
            console.error('Error removing collaborator:', error);

            return {
                success: false,
                error: error.response?.data?.message || 'Error al eliminar colaborador'
            };
        }
    }
}

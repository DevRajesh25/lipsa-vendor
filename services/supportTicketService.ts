import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs,
  doc,
  updateDoc,
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';

export interface SupportTicket {
  id: string;
  vendorId: string;
  vendorName: string;
  subject: string;
  message: string;
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  priority: 'low' | 'normal' | 'high';
  adminReply?: string;
  createdAt: Date;
  updatedAt?: Date;
  repliedAt?: Date;
}

export interface CreateTicketData {
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high';
}

// Create a new support ticket
export const createSupportTicket = async (
  vendorId: string,
  vendorName: string,
  ticketData: CreateTicketData
): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, 'supportTickets'), {
      vendorId,
      vendorName,
      subject: ticketData.subject,
      message: ticketData.message,
      priority: ticketData.priority,
      status: 'open',
      createdAt: serverTimestamp()
    });
    
    return docRef.id;
  } catch (error: any) {
    console.error('Create support ticket error:', error);
    throw new Error(error.message || 'Failed to create support ticket');
  }
};

// Get vendor's support tickets
export const getVendorSupportTickets = async (vendorId: string): Promise<SupportTicket[]> => {
  try {
    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      where('vendorId', '==', vendorId),
      orderBy('createdAt', 'desc')
    );

    const ticketsSnapshot = await getDocs(ticketsQuery);
    
    return ticketsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        subject: data.subject,
        message: data.message,
        status: data.status,
        priority: data.priority,
        adminReply: data.adminReply,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        repliedAt: data.repliedAt?.toDate()
      } as SupportTicket;
    });
  } catch (error: any) {
    console.error('Get vendor support tickets error:', error);
    throw new Error(error.message || 'Failed to fetch support tickets');
  }
};

// Get all support tickets (for admin)
export const getAllSupportTickets = async (): Promise<SupportTicket[]> => {
  try {
    const ticketsQuery = query(
      collection(db, 'supportTickets'),
      orderBy('createdAt', 'desc')
    );

    const ticketsSnapshot = await getDocs(ticketsQuery);
    
    return ticketsSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        vendorId: data.vendorId,
        vendorName: data.vendorName,
        subject: data.subject,
        message: data.message,
        status: data.status,
        priority: data.priority,
        adminReply: data.adminReply,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate(),
        repliedAt: data.repliedAt?.toDate()
      } as SupportTicket;
    });
  } catch (error: any) {
    console.error('Get all support tickets error:', error);
    throw new Error(error.message || 'Failed to fetch support tickets');
  }
};

// Update ticket status (admin only)
export const updateTicketStatus = async (
  ticketId: string,
  status: SupportTicket['status']
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    await updateDoc(ticketRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error: any) {
    console.error('Update ticket status error:', error);
    throw new Error(error.message || 'Failed to update ticket status');
  }
};

// Add admin reply to ticket
export const addAdminReply = async (
  ticketId: string,
  adminReply: string,
  newStatus?: SupportTicket['status']
): Promise<void> => {
  try {
    const ticketRef = doc(db, 'supportTickets', ticketId);
    const updateData: any = {
      adminReply,
      repliedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    if (newStatus) {
      updateData.status = newStatus;
    }

    await updateDoc(ticketRef, updateData);
  } catch (error: any) {
    console.error('Add admin reply error:', error);
    throw new Error(error.message || 'Failed to add admin reply');
  }
};

// Get ticket statistics (for admin dashboard)
export const getTicketStatistics = async () => {
  try {
    const tickets = await getAllSupportTickets();
    
    const stats = {
      total: tickets.length,
      open: tickets.filter(t => t.status === 'open').length,
      inProgress: tickets.filter(t => t.status === 'in-progress').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      highPriority: tickets.filter(t => t.priority === 'high').length
    };

    return stats;
  } catch (error: any) {
    console.error('Get ticket statistics error:', error);
    throw new Error(error.message || 'Failed to get ticket statistics');
  }
};
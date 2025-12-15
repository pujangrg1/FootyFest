import { collection, addDoc, query, where, getDocs, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';

const ACTIVITY_LOGS_COLLECTION = 'user_activity';

/**
 * Log user activity (login, signup, etc.)
 */
export async function logUserActivity({
  userId,
  email,
  activityType, // 'login', 'signup', 'logout', 'role_change', etc.
  metadata = {},
}) {
  if (!db) {
    console.warn('Firestore not available - activity not logged');
    return;
  }

  try {
    const logData = {
      userId,
      email,
      activityType,
      metadata,
      timestamp: serverTimestamp(),
      createdAt: new Date().toISOString(),
    };
    console.log('Logging user activity:', logData);
    const docRef = await addDoc(collection(db, ACTIVITY_LOGS_COLLECTION), logData);
    console.log('Activity logged successfully with ID:', docRef.id);
  } catch (error) {
    console.error('Error logging user activity:', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

/**
 * Get activity logs for a specific user (for admins)
 */
export async function getUserActivityLogs(userId, limitCount = 50) {
  if (!db) {
    return [];
  }

  try {
    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      where('userId', '==', userId),
      orderBy('timestamp', 'desc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error fetching user activity logs:', error);
    return [];
  }
}

/**
 * Get all login events (for admins)
 * Uses a simple query without index requirements, filtering in memory
 */
export async function getAllLoginLogs(limitCount = 100) {
  if (!db) {
    console.warn('Firestore not available');
    return [];
  }

  try {
    // Use simple query without index - get all recent logs and filter
    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount * 3) // Get more to account for filtering
    );
    const snapshot = await getDocs(q);
    const allLogs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    });
    
    console.log(`Fetched ${allLogs.length} total logs, filtering for login activities`);
    
    // Filter for login activities and sort by timestamp
    const loginLogs = allLogs
      .filter(log => {
        const isLogin = log.activityType === 'login';
        if (!isLogin) return false;
        // Ensure we have required fields
        return log.userId && (log.email || log.metadata?.email);
      })
      .sort((a, b) => {
        // Sort by timestamp if available, otherwise by createdAt
        const timeA = a.timestamp?.toDate 
          ? a.timestamp.toDate().getTime() 
          : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.timestamp?.toDate 
          ? b.timestamp.toDate().getTime() 
          : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      })
      .slice(0, limitCount);
    
    console.log(`Found ${loginLogs.length} login logs`);
    return loginLogs;
  } catch (error) {
    console.error('Error fetching login logs:', error);
    
    // If createdAt index doesn't exist, try getting all without orderBy
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.log('Index error, trying query without orderBy');
      try {
        const fallbackQuery = query(
          collection(db, ACTIVITY_LOGS_COLLECTION),
          limit(limitCount * 5)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const allLogs = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const loginLogs = allLogs
          .filter(log => log.activityType === 'login')
          .sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          })
          .slice(0, limitCount);
        
        console.log(`Fallback query found ${loginLogs.length} login logs`);
        return loginLogs;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
    
    return [];
  }
}

/**
 * Get all signup events (for admins)
 * Uses a simple query without index requirements, filtering in memory
 */
export async function getAllSignupLogs(limitCount = 100) {
  if (!db) {
    console.warn('Firestore not available');
    return [];
  }

  try {
    // Use simple query without index - get all recent logs and filter
    const q = query(
      collection(db, ACTIVITY_LOGS_COLLECTION),
      orderBy('createdAt', 'desc'),
      limit(limitCount * 3) // Get more to account for filtering
    );
    const snapshot = await getDocs(q);
    const allLogs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
      };
    });
    
    console.log(`Fetched ${allLogs.length} total logs, filtering for signup activities`);
    
    // Filter for signup activities and sort by timestamp
    const signupLogs = allLogs
      .filter(log => {
        const isSignup = log.activityType === 'signup';
        if (!isSignup) return false;
        // Ensure we have required fields
        return log.userId && (log.email || log.metadata?.email);
      })
      .sort((a, b) => {
        // Sort by timestamp if available, otherwise by createdAt
        const timeA = a.timestamp?.toDate 
          ? a.timestamp.toDate().getTime() 
          : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
        const timeB = b.timestamp?.toDate 
          ? b.timestamp.toDate().getTime() 
          : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
        return timeB - timeA;
      })
      .slice(0, limitCount);
    
    console.log(`Found ${signupLogs.length} signup logs`);
    return signupLogs;
  } catch (error) {
    console.error('Error fetching signup logs:', error);
    
    // If createdAt index doesn't exist, try getting all without orderBy
    if (error.code === 'failed-precondition' || error.message?.includes('index')) {
      console.log('Index error, trying query without orderBy');
      try {
        const fallbackQuery = query(
          collection(db, ACTIVITY_LOGS_COLLECTION),
          limit(limitCount * 5)
        );
        const fallbackSnapshot = await getDocs(fallbackQuery);
        const allLogs = fallbackSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        const signupLogs = allLogs
          .filter(log => log.activityType === 'signup')
          .sort((a, b) => {
            const timeA = a.timestamp?.toDate ? a.timestamp.toDate().getTime() : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
            const timeB = b.timestamp?.toDate ? b.timestamp.toDate().getTime() : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
            return timeB - timeA;
          })
          .slice(0, limitCount);
        
        console.log(`Fallback query found ${signupLogs.length} signup logs`);
        return signupLogs;
      } catch (fallbackError) {
        console.error('Fallback query also failed:', fallbackError);
        return [];
      }
    }
    
    return [];
  }
}

/**
 * Get activity statistics (for admins)
 */
export async function getActivityStats(startDate, endDate) {
  if (!db) {
    return null;
  }

  try {
    // Try with timestamp first, fallback to createdAt if needed
    let snapshot;
    try {
      const q = query(
        collection(db, ACTIVITY_LOGS_COLLECTION),
        orderBy('timestamp', 'desc')
      );
      snapshot = await getDocs(q);
    } catch (timestampError) {
      // Fallback to createdAt if timestamp index doesn't exist
      console.log('Timestamp index may not exist, using createdAt for stats');
      const q = query(
        collection(db, ACTIVITY_LOGS_COLLECTION),
        orderBy('createdAt', 'desc')
      );
      snapshot = await getDocs(q);
    }
    
    const logs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert timestamp if it's a Firestore timestamp
        timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : (data.timestamp ? new Date(data.timestamp) : new Date(data.createdAt)),
      };
    });
    
    const filteredLogs = logs.filter(log => {
      if (!log.timestamp) return false;
      const logDate = log.timestamp instanceof Date ? log.timestamp : new Date(log.createdAt);
      if (startDate && logDate < startDate) return false;
      if (endDate && logDate > endDate) return false;
      return true;
    });

    const stats = {
      totalLogins: filteredLogs.filter(l => l.activityType === 'login').length,
      totalSignups: filteredLogs.filter(l => l.activityType === 'signup').length,
      totalLogouts: filteredLogs.filter(l => l.activityType === 'logout').length,
      uniqueUsers: new Set(filteredLogs.map(l => l.userId)).size,
      byDate: {},
    };

    // Group by date
    filteredLogs.forEach(log => {
      const logDate = log.timestamp instanceof Date ? log.timestamp : new Date(log.createdAt);
      const dateKey = logDate.toISOString().split('T')[0];
      if (!stats.byDate[dateKey]) {
        stats.byDate[dateKey] = { logins: 0, signups: 0, logouts: 0 };
      }
      if (log.activityType === 'login') stats.byDate[dateKey].logins++;
      if (log.activityType === 'signup') stats.byDate[dateKey].signups++;
      if (log.activityType === 'logout') stats.byDate[dateKey].logouts++;
    });

    return stats;
  } catch (error) {
    console.error('Error fetching activity stats:', error);
    return null;
  }
}


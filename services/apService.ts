import { MOCK_USER } from '../constants';
import { triggerToast } from '../components/NotificationToast';
import { mongoService } from './mongoService';

export const apService = {
  /**
   * Checks if AP needs to be reset based on 12 AM boundary,
   * then awards AP and adds it to both daily AP and total AP.
   */
  awardAP: (amount: number, reason: string, icon: string = '⚡', showToast: boolean = true, syncFirebase: boolean = true) => {
    // 1. Check for Reset (12 AM Bangladesh Time)
    const now = Date.now();
    const lastReset = MOCK_USER.lastApReset || now;
    
    // Create Date objects for Bangladesh time
    const bdNowStr = new Date(now).toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    const bdLastStr = new Date(lastReset).toLocaleString("en-US", { timeZone: "Asia/Dhaka" });
    
    const bdNow = new Date(bdNowStr);
    const bdLast = new Date(bdLastStr);
    
    // Are we on a different day?
    const isNewDay = bdNow.getDate() !== bdLast.getDate() || bdNow.getMonth() !== bdLast.getMonth() || bdNow.getFullYear() !== bdLast.getFullYear();
    
    if (isNewDay || !MOCK_USER.lastApReset) {
      MOCK_USER.ap = 0;
      MOCK_USER.lastApReset = now;
    }

    // 2. Add AP
    MOCK_USER.ap = (MOCK_USER.ap || 0) + amount;
    MOCK_USER.totalAp = (MOCK_USER.totalAp || 0) + amount;

    // 3. Update Storage
    const allUsers = JSON.parse(localStorage.getItem('friends_bd_users') || '[]');
    const userIndex = allUsers.findIndex((u: any) => u.id === MOCK_USER.id);
    if (userIndex > -1) {
      allUsers[userIndex].ap = MOCK_USER.ap;
      allUsers[userIndex].totalAp = MOCK_USER.totalAp;
      allUsers[userIndex].lastApReset = MOCK_USER.lastApReset;
      localStorage.setItem('friends_bd_users', JSON.stringify(allUsers));
    }

    const sessionStr = localStorage.getItem('user_session');
    if (sessionStr) {
      const u = JSON.parse(sessionStr);
      u.ap = MOCK_USER.ap;
      u.totalAp = MOCK_USER.totalAp;
      u.lastApReset = MOCK_USER.lastApReset;
      localStorage.setItem('user_session', JSON.stringify(u));
      window.dispatchEvent(new Event('storage'));
    }

    // Sync with Firebase Firestore
    if (MOCK_USER.id && syncFirebase) {
      mongoService.updateUser(MOCK_USER.id, {
        ap: MOCK_USER.ap,
        totalAp: MOCK_USER.totalAp,
        lastApReset: MOCK_USER.lastApReset
      }).catch(err => console.warn('AP firebase sync failed:', err));
    }

    // 4. Update AP Log
    const apLog = JSON.parse(localStorage.getItem('ap_log') || '[]');
    apLog.unshift({ 
      id: Date.now(), 
      title: reason, 
      amount: amount, 
      date: new Date().toISOString(), 
      icon: icon 
    });
    localStorage.setItem('ap_log', JSON.stringify(apLog));

    // 5. Trigger Toast Notification if requested
    if (showToast) {
      triggerToast({
        id: 'ap-reward-' + Date.now(),
        senderId: 'system',
        senderName: 'System',
        senderAvatar: 'https://i.pravatar.cc/100?img=12',
        type: 'REWARD',
        message: `${reason}! +${amount} AP ⚡`,
        timestamp: Date.now(),
        isRead: false
      } as any);
    }
  }
};

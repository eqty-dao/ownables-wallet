import axios from "axios";

class ActivityLogService {

  activityLog: ActivityLog[];
  constructor() {
    this.activityLog =
      window.localStorage.getItem('activityLog') ?
        JSON.parse(window.localStorage.getItem('activityLog') || '[]') : [];
  }

  logActivity(activity: ActivityLog) {
    this.activityLog.push(activity);
    window.localStorage.setItem('activityLog', JSON.stringify(this.activityLog));
  }


  getAllLogs() {
    if (this.activityLog.length === 0) {
      //check if there is any activity log in local storage
      this.activityLog =
        window.localStorage.getItem('activityLog') ?
          JSON.parse(window.localStorage.getItem('activityLog') || '[]') : [];
    }
    const _ = this.activityLog;
    //sort the logs by timestamp
    _.sort((a, b) => b.timestamp - a.timestamp);
    return _;
  }

  async getOBuilderAvailable() {
    try {
      const oBuilder = await axios.get('https://ltonetwork.com/data/obuilder.json');
      if (oBuilder.status === 200) {
        return oBuilder.data.active === 1;
      } else {
        return true;
      }
    } catch (error) {
      console.error(error);
      return true;
    }
  }

  async checkToUseBackupOBuilder() {
    if(process.env.REACT_APP_USE_BACKUP_OBUILDER === 'false') {
      return false;
    }
    try {
      const oBuilder = await axios.get('https://ltonetwork.com/data/obuilder.json');
      if (oBuilder.status === 200) {
        return oBuilder.data.useBackup === 1;
      } else {
        return false;
      }
    } catch (error) {
      console.error(error);
      return false;
    }
  }

}

export const activityLogService = new ActivityLogService();

export interface ActivityLog {
  activity: string;
  timestamp: number;
}

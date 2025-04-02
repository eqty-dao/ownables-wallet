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

  async getOBuilderAvailable(): Promise<OBuilderResponse> {
    try {
      const oBuilder = await axios.get('https://ltonetwork.com/data/obuilder.json');
      if (oBuilder.status === 200) {
        return {
          active: oBuilder?.data.active,
          useBackup: oBuilder?.data.useBackup,
          message: oBuilder?.data.message || ''
        }
      } else {
        return {
          active: 1,
          useBackup: 0,
          message: ''
        }
      }
    } catch (error) {
      console.error(error);
      return {
        active: 1,
        useBackup: 0,
        message: ''
      }
    }
  }



  async checkToUseBackupOBuilder(): Promise<boolean> {
    if (process.env.REACT_APP_USE_BACKUP_OBUILDER === 'false') {
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

export interface OBuilderResponse {
  active: number;
  useBackup: number;
  message: string;
}
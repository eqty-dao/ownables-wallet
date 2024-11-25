import { getNetworkFromQuery } from './services/LTO.service';
import process from 'process';
const netWork = getNetworkFromQuery();

export var AppConfig ={

  OBUILDER: () => {
    if (netWork === 'T') {
      return process.env.REACT_APP_OBUILDER_STAGING;
    } else {
      return process.env.REACT_APP_OBUILDER_PROD;
    }
  },
  OBRIDGE: () => {
    if (netWork === 'T') {
      return process.env.REACT_APP_OBRIDGE_STAGING;
    } else {
      return process.env.REACT_APP_OBRIDGE_PROD;
    }
  },
  RELAY: () => {
    if (netWork === 'T') {
      return process.env.REACT_APP_RELAY_STAGING;
    } else {
      return process.env.REACT_APP_RELAY_PROD;
    }
  },
}



// REACT_APP_OBUILDER_STAGING=http://obuilder-staging.eba-ftdayif2.eu-west-1.elasticbeanstalk.com
// REACT_APP_RELAY_STAGING=https://relay-dev.lto.network
// REACT_APP_OBRIDGE_STAGING=http://obridge-staging.eba-dge2pr4q.eu-west-1.elasticbeanstalk.com/api/v1

// REACT_APP_OBUILDER_PROD=http://obuilder-env.eu-west-1.elasticbeanstalk.com
// REACT_APP_RELAY_PROD=https://relay.lto.network
// REACT_APP_OBRIDGE_PROD=http://obridge-staging.eba-dge2pr4q.eu-west-1.elasticbeanstalk.com/api/v1

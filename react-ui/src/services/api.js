import { apiUrl } from '../constants';

export const buildRequest = (urlSuffix, method, requestBody, token, onLogout, showFlashMsg) => {
  return new Promise((resolve, reject) => {
    const fetchParams = {
      headers: {},
      method: method || 'GET',
    };

    if (token) {
      fetchParams.headers['Authorization'] = `Bearer ${token}`;
    }

    if (method === 'POST' || method === 'PUT') {
      fetchParams.body = JSON.stringify(requestBody);
      fetchParams.headers['content-type'] = 'application/json';
    }

    const url = apiUrl ? `${apiUrl}/api${urlSuffix}` : `/api${urlSuffix}`;
    
    fetch(url, fetchParams)
      .then((res) => {
        const status = res.status;
        if (status === 401) {
          if (onLogout) onLogout();
          throw new Error('Session expired. Please login again.');
        }
        return res.json();
      })
      .then((data) => {
        if (data.error) {
          throw new Error(data.error);
        }
        resolve(data);
      })
      .catch((err) => {
        if (showFlashMsg) {
          showFlashMsg(`Error: ${err.message || err}`);
        }
        reject(err);
      });
  });
};


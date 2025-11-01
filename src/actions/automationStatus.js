export const AUTOMATION_STATUS_UPDATE  = 'AUTOMATION_STATUS_UPDATE';

export const updateAutomationStatus = (id, data) => dispatch => {
  dispatch({
    type: AUTOMATION_STATUS_UPDATE,
    id,
    data,
  });
};

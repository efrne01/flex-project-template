import * as Flex from '@twilio/flex-ui';

import { getMyCallSid, getCall } from '../../helpers/MultiCallHelper';
import { FlexActionEvent, FlexAction } from '../../../../types/feature-loader';

export const actionEvent = FlexActionEvent.before;
export const actionName = FlexAction.SelectTask;
export const actionHook = function handleMultiCallSelectTask(flex: typeof Flex, manager: Flex.Manager) {
  flex.Actions.addListener(`${actionEvent}${actionName}`, async (payload, _abortFunction) => {
    let task = null;

    if (payload.task) {
      task = payload.task;
    } else if (payload.sid) {
      task = Flex.TaskHelper.getTaskByTaskSid(payload.sid);
    } else {
      // deselected task; do nothing
      return;
    }

    const callSid = getMyCallSid(task);

    if (!callSid) {
      return;
    }

    // update state with the currently selected call
    const call = getCall(callSid);
    if (call) {
      manager.store.dispatch({ type: 'PHONE_ADD_CALL', payload: call });
    }
  });
};

import * as Flex from '@twilio/flex-ui';

import * as HangUpByHelper from '../../helpers/hangUpBy';
import { HangUpBy } from '../../enums/hangUpBy';
import TaskRouterService from '../../../../utils/serverless/TaskRouter/TaskRouterService';
import { FlexEvent } from '../../../../types/feature-loader';
import logger from '../../../../utils/logger';

export const eventName = FlexEvent.taskWrapup;
export const eventHook = async (_flex: typeof Flex, _manager: Flex.Manager, task: Flex.ITask) => {
  if (task.attributes && !task.attributes.conference) {
    // no conference? no call! this functionality is call-specific, so return.
    return;
  }

  let currentHangUpBy = HangUpByHelper.getHangUpBy()[task.sid];

  if (
    currentHangUpBy !== HangUpBy.Consult &&
    task.incomingTransferObject &&
    HangUpByHelper.hasAnotherWorkerJoined(task)
  ) {
    currentHangUpBy = HangUpBy.Consult;
    HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
  }

  if (!currentHangUpBy) {
    // If this worker hung up, this would have been set in beforeHangupCall or beforeKickParticipant
    // Therefore, must be customer hangup
    currentHangUpBy = HangUpBy.Customer;
    HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
  }

  switch (currentHangUpBy) {
    case HangUpBy.CompletedExternalWarmTransfer:
      // If the task has the destination attribute, this was a warm transfer
      currentHangUpBy = HangUpBy.ExternalWarmTransfer;
      HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
      break;
    case HangUpBy.ColdTransfer:
    case HangUpBy.ExternalColdTransfer:
      break;
    case HangUpBy.ExternalWarmTransfer:
      // If we get here, it means the customer hung up before the agent could complete the warm transfer
      // Or, the external party left before the call ended, and the customer ended the call later.
      currentHangUpBy = HangUpBy.Customer;
      HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
      break;
    case HangUpBy.Consult:
    case HangUpBy.WarmTransfer:
      // If there's no other worker but we got here, someone hung up and it wasn't us!
      // if (!HangUpByHelper.hasAnotherWorkerJoined(task)) {
      if (!(await HangUpByHelper.hasCustomerJoined(task))) {
        currentHangUpBy = HangUpBy.Customer;
        HangUpByHelper.setHangUpBy(task.sid, currentHangUpBy);
      }
      break;
    default:
      break;
  }

  const attributes = {
    conversations: {
      hang_up_by: currentHangUpBy,
    },
  };

  try {
    await TaskRouterService.updateTaskAttributes(task.taskSid, attributes);
    logger.debug(`[hang-up-by] Set conversation attributes for ${task.taskSid}`, attributes);
  } catch (error: any) {
    logger.error(`[hang-up-by] Failed to set conversation attributes for ${task.taskSid}`, error);
  }
};

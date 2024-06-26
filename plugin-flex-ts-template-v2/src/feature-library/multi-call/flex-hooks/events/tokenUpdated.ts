import * as Flex from '@twilio/flex-ui';
import { SSOTokenPayload } from '@twilio/flex-ui/src/core/TokenStorage';

import { SecondDevice } from '../../helpers/MultiCallHelper';
import { FlexEvent } from '../../../../types/feature-loader';
import logger from '../../../../utils/logger';

export const eventName = FlexEvent.tokenUpdated;
export const eventHook = (flex: typeof Flex, manager: Flex.Manager, tokenPayload: SSOTokenPayload) => {
  if (!SecondDevice) return;

  if (SecondDevice?.state === 'destroyed') {
    return;
  }

  SecondDevice?.updateToken(tokenPayload.token);

  logger.info('[multi-call] Token updated');
};

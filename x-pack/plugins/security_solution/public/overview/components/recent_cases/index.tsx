/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';

import { useKibana } from '../../../common/lib/kibana';
import { APP_ID } from '../../../../common/constants';

const MAX_CASES_TO_SHOW = 3;
const RecentCasesComponent = () => {
  const { cases } = useKibana().services;

  const userCasesPermissions = cases.helpers.canUseCases([APP_ID]);

  return cases.ui.getRecentCases({
    permissions: userCasesPermissions,
    maxCasesToShow: MAX_CASES_TO_SHOW,
    owner: [APP_ID],
  });
};

RecentCasesComponent.displayName = 'RecentCasesComponent';

export const RecentCases = React.memo(RecentCasesComponent);

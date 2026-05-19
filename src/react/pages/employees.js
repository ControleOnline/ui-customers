import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';
import {
  normalizePeopleContextType,
} from '@controleonline/ui-people/src/react/utils/peopleContext';

const normalizePeopleType = value =>
  String(value ?? '')
    .trim()
    .toUpperCase();

export const buildEmployeesContext = routeParams => {
  const normalizedSelectedContext = normalizePeopleContextType(routeParams?.selectedContext);
  const normalizedDefaultContext = normalizePeopleContextType(routeParams?.defaultContext);
  const normalizedContext = Array.isArray(routeParams?.context)
    ? routeParams.context
    : routeParams?.context
      ? [routeParams.context]
      : normalizedSelectedContext
        ? [normalizedSelectedContext]
        : ['employee', 'owner', 'courier'];

  const defaultContext =
    normalizedDefaultContext ||
    normalizedSelectedContext ||
    normalizePeopleContextType(normalizedContext[0]) ||
    'employee';

  const modalTitleByType = {
    employee: 'Cadastro de Funcionario',
    owner: 'Cadastro de Proprietario',
    courier: 'Cadastro de Entregador',
    ...(routeParams?.modalTitleByType || {}),
  };

  return {
    context: normalizedContext.map(type => normalizePeopleContextType(type)).filter(Boolean),
    defaultContext,
    selectedContext: normalizedSelectedContext || defaultContext,
    defaultPeopleType:
      normalizePeopleType(routeParams?.defaultPeopleType) ||
      (defaultContext === 'courier' ? 'F' : 'J'),
    title: routeParams?.title || global.t?.t('people', 'label', defaultContext),
    searchPlaceholder:
      routeParams?.searchPlaceholder || global.t?.t('people', 'label', defaultContext),
    modalTitleByType,
    typeSelectorLabel:
      routeParams?.typeSelectorLabel || global.t?.t('people', 'label', 'contactRole'),
  };
};

const Employees = ({route}) => {
  const context = buildEmployeesContext(route?.params || {});

  return (
    <People
      context={context}
    />
  );
};

export default Employees;

import React from 'react';
import People from '@controleonline/ui-people/src/react/pages/People';
import {
  normalizePeopleContextType,
} from '@controleonline/ui-people/src/react/utils/peopleContext';
import {
  HUMAN_COMPANY_LINK_TYPES,
} from '@controleonline/ui-people/src/react/utils/peopleLinkFilters';

const normalizePeopleType = value =>
  String(value ?? '')
    .trim()
    .toUpperCase();

/** Human roles that default to pessoa física (PF) on create. */
const PHYSICAL_PERSON_LINK_TYPES = ['employee', 'courier', 'salesman', 'after-sales'];

export const DEFAULT_EMPLOYEE_CONTEXT_TYPES = [...HUMAN_COMPANY_LINK_TYPES];

export const buildEmployeesContext = routeParams => {
  const normalizedSelectedContext = normalizePeopleContextType(routeParams?.selectedContext);
  const normalizedDefaultContext = normalizePeopleContextType(routeParams?.defaultContext);
  const normalizedContext = Array.isArray(routeParams?.context)
    ? routeParams.context
    : routeParams?.context
      ? [routeParams.context]
      : normalizedSelectedContext
        ? [normalizedSelectedContext]
        : DEFAULT_EMPLOYEE_CONTEXT_TYPES;

  const defaultContext =
    normalizedDefaultContext ||
    normalizedSelectedContext ||
    normalizePeopleContextType(normalizedContext[0]) ||
    'employee';

  const modalTitleByType = {
    employee: 'Cadastro de Funcionario',
    owner: 'Cadastro de Proprietario',
    director: 'Cadastro de Diretor',
    manager: 'Cadastro de Gerente',
    salesman: 'Cadastro de Vendedor',
    'after-sales': 'Cadastro de Pos-venda',
    courier: 'Cadastro de Entregador',
    ...(routeParams?.modalTitleByType || {}),
  };

  const prefersPhysicalPerson = PHYSICAL_PERSON_LINK_TYPES.includes(defaultContext);

  return {
    context: normalizedContext.map(type => normalizePeopleContextType(type)).filter(Boolean),
    defaultContext,
    selectedContext: normalizedSelectedContext || defaultContext,
    defaultPeopleType:
      normalizePeopleType(routeParams?.defaultPeopleType) ||
      (prefersPhysicalPerson ? 'F' : 'J'),
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

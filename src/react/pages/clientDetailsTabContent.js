import React from 'react';
import { ScrollView } from 'react-native';
import GeneralTab from '../components/tabs/GeneralTab';
import UsersTab from '../components/tabs/UsersTab';
import SalesmanTab from '../components/tabs/SalesmanTab';
import EmployeesTab from '../components/tabs/EmployeesTab';
import ContractsTab from '../components/tabs/ContractsTab';
import ProductsTab from '../components/tabs/ProductsTab';
import MediaTab from '../components/tabs/MediaTab';
import FiscalTab from '../components/tabs/FiscalTab';
import FranchiseLinksTab from '../components/tabs/FranchiseLinksTab';
import styles from './details.page.styles';
import {
  inlineStyle_299_16,
  inlineStyle_317_16,
  inlineStyle_334_16,
  inlineStyle_342_16,
} from './details.styles';

/**
 * Renders the active ClientDetails tab body. Keeps details.js under the line budget.
 */
export const renderClientDetailsTabContent = ({
  activeTabKey,
  tabProps,
  isPessoaJuridica,
  navigation,
  handleClientMediaChanged,
}) => {
  if (activeTabKey === 'general') {
    return <GeneralTab {...tabProps} />;
  }

  if (activeTabKey === 'fiscal') {
    return (
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={styles.tabScrollContent}
        showsVerticalScrollIndicator={false}>
        <FiscalTab {...tabProps} navigation={navigation} />
      </ScrollView>
    );
  }

  if (activeTabKey === 'media') {
    return (
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={inlineStyle_342_16}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
        <MediaTab client={tabProps.client} onChanged={handleClientMediaChanged} />
      </ScrollView>
    );
  }

  if (activeTabKey === 'sellers' || activeTabKey === 'users') {
    return (
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={inlineStyle_299_16}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
        {isPessoaJuridica ? (
          <SalesmanTab
            {...tabProps}
            title="Vendedores"
            linkType="sellers-client"
            emptyText="Nenhum vendedor vinculado"
            errorText="Nao foi possivel carregar os vendedores vinculados."
          />
        ) : (
          <UsersTab {...tabProps} />
        )}
      </ScrollView>
    );
  }

  if (activeTabKey === 'franchise') {
    return (
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={inlineStyle_299_16}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
        <FranchiseLinksTab
          {...tabProps}
          emptyText="Nenhuma franquia ou filial vinculada"
          errorText="Não foi possível carregar os vínculos de franquia/filial."
        />
      </ScrollView>
    );
  }

  if (activeTabKey === 'contacts') {
    return (
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={inlineStyle_317_16}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
        <EmployeesTab
          {...tabProps}
          title="Contatos"
          emptyText="Nenhum contato vinculado"
          errorText="Nao foi possivel carregar os contatos vinculados."
          createTitle="Adicionar Contato"
          requiredErrorText="Nome e apelido do contato sao obrigatorios."
          createSuccessText="Contato cadastrado com sucesso."
          createErrorText="Nao foi possivel cadastrar o contato."
        />
      </ScrollView>
    );
  }

  if (activeTabKey === 'products') {
    return (
      <ScrollView
        style={styles.tabScroll}
        contentContainerStyle={inlineStyle_334_16}
        nestedScrollEnabled
        showsVerticalScrollIndicator={false}>
        <ProductsTab {...tabProps} />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={styles.tabScroll}
      contentContainerStyle={inlineStyle_342_16}
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}>
      <ContractsTab {...tabProps} />
    </ScrollView>
  );
};

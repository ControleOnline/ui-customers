import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildAvailableSalesmanOptions,
  buildSalesmanSavePayload,
  canManageSalesmen,
  normalizeSalesmanLink,
  toPeopleIri,
} from './salesmanTab.helpers';
import { extractId } from './salesmanTabHelpers';
import {
  buildPeopleLinkReadParams,
  buildSalesmanLinksFromPeopleLinks,
} from './employeeContacts';
import { normalizeCollection } from './salesmanTabMedia';

/**
 * Administrative manage (link/edit/remove) for SalesmanTab when APP_TYPE=MANAGER.
 */
export function useSalesmanManage({
  appType,
  client,
  clientId,
  currentCompanyId,
  linkType,
  clients,
  setClients,
  setIsLoading,
  peopleActions,
  getPeopleLinks,
  savePeopleLink,
  removePeopleLink,
  loadDefaultSalesmanLinks,
  showDialog,
  showError,
  showSuccess,
}) {
  const canManage = useMemo(() => canManageSalesmen(appType), [appType]);
  const clientIri = useMemo(() => toPeopleIri(client), [client]);
  const [availableSalesmen, setAvailableSalesmen] = useState([]);
  const [linkedNormalized, setLinkedNormalized] = useState([]);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingManageLink, setEditingManageLink] = useState(null);
  const [manageForm, setManageForm] = useState({
    sellerIri: '',
    commission: '0',
    minimumCommission: '0',
  });
  const [isManageSaving, setIsManageSaving] = useState(false);

  useEffect(() => {
    setLinkedNormalized(
      (Array.isArray(clients) ? clients : [])
        .map(item => normalizeSalesmanLink(item))
        .filter(Boolean),
    );
  }, [clients]);

  useEffect(() => {
    let cancelled = false;
    if (!canManage || !currentCompanyId || !peopleActions?.getItems) {
      setAvailableSalesmen([]);
      return undefined;
    }
    peopleActions
      .getItems({
        'link.company': `/people/${currentCompanyId}`,
        'link.linkType': 'salesman',
        peopleType: 'F',
        itemsPerPage: 100,
      })
      .then(response => {
        if (!cancelled) {
          setAvailableSalesmen(
            Array.isArray(response) ? response : normalizeCollection(response),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setAvailableSalesmen([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canManage, currentCompanyId, peopleActions]);

  const salesmanOptions = useMemo(
    () =>
      buildAvailableSalesmanOptions({
        salesmen: availableSalesmen,
        linkedSalesmen: linkedNormalized,
        editingLink: editingManageLink,
      }),
    [availableSalesmen, linkedNormalized, editingManageLink],
  );

  const openManageModal = useCallback(link => {
    setEditingManageLink(link || null);
    setManageForm({
      sellerIri: link?.sellerIri || '',
      commission: String(link?.commission ?? 0),
      minimumCommission: String(link?.minimumCommission ?? 0),
    });
    setShowManageModal(true);
  }, []);

  const closeManageModal = useCallback(() => {
    setShowManageModal(false);
    setEditingManageLink(null);
  }, []);

  const handleManageSave = useCallback(async () => {
    if (!savePeopleLink || !clientIri) {
      showError('Nao foi possivel salvar o vendedor neste momento.');
      return;
    }
    const payload = buildSalesmanSavePayload({
      editingLink: editingManageLink,
      formData: manageForm,
      clientIri,
      linkType: linkType || 'sellers-client',
    });
    if (!payload) {
      showError('Selecione um vendedor valido.');
      return;
    }
    setIsManageSaving(true);
    try {
      await savePeopleLink(payload);
      showSuccess(
        editingManageLink
          ? 'Vendedor atualizado com sucesso!'
          : 'Vendedor vinculado com sucesso!',
      );
      closeManageModal();
      setIsLoading(true);
      if (getPeopleLinks && clientId) {
        const params = buildPeopleLinkReadParams({
          clientId,
          linkType: linkType || 'sellers-client',
        });
        const items = await getPeopleLinks(params);
        const nextClients = buildSalesmanLinksFromPeopleLinks(items, {
          clientId,
          linkType: linkType || 'sellers-client',
        });
        setClients(nextClients);
        if (loadDefaultSalesmanLinks) {
          await loadDefaultSalesmanLinks(
            nextClients.map(item => item?.company?.id || item?.company?.['@id']),
          );
        }
      }
    } catch {
      showError(
        editingManageLink
          ? 'Nao foi possivel atualizar o vendedor.'
          : 'Nao foi possivel vincular o vendedor.',
      );
    } finally {
      setIsManageSaving(false);
      setIsLoading(false);
    }
  }, [
    savePeopleLink,
    clientIri,
    editingManageLink,
    manageForm,
    linkType,
    showError,
    showSuccess,
    closeManageModal,
    setIsLoading,
    getPeopleLinks,
    clientId,
    setClients,
    loadDefaultSalesmanLinks,
  ]);

  const handleManageDelete = useCallback(
    link => {
      if (!link?.id || !removePeopleLink) {
        showError('Nao foi possivel identificar o vinculo para remover.');
        return;
      }
      showDialog({
        title: 'Remover vendedor',
        message: 'Deseja realmente remover este vendedor do cliente?',
        confirmLabel: 'Remover',
        cancelLabel: 'Cancelar',
        onConfirm: async () => {
          try {
            await removePeopleLink(link.id);
            showSuccess('Vendedor removido com sucesso!');
            setClients(prev =>
              (prev || []).filter(
                item => extractId(item?.id) !== extractId(link.id),
              ),
            );
          } catch {
            showError('Nao foi possivel remover o vendedor.');
          }
        },
      });
    },
    [removePeopleLink, showDialog, showError, showSuccess, setClients],
  );

  return {
    canManage,
    linkedNormalized,
    showManageModal,
    editingManageLink,
    manageForm,
    setManageForm,
    isManageSaving,
    salesmanOptions,
    openManageModal,
    closeManageModal,
    handleManageSave,
    handleManageDelete,
  };
}

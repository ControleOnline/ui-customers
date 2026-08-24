import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  buildAvailableFranchiseOptions,
  buildFranchiseLinkReadParams,
  buildFranchiseSavePayload,
  canManageFranchiseLinks,
  normalizeFranchiseLink,
  toPeopleIri,
} from './franchiseLinksTab.helpers';
import { extractId } from './salesmanTabHelpers';
import { buildFranchiseLinksFromPeopleLinks } from './franchiseLinksTab.helpers';
import { normalizeCollection } from './salesmanTabMedia';

/**
 * Administrative manage (link/edit/remove) for FranchiseLinksTab when APP_TYPE=MANAGER.
 */
export function useFranchiseLinksManage({
  appType,
  client,
  clientId,
  currentCompanyId,
  links,
  setLinks,
  setIsLoading,
  peopleActions,
  getPeopleLinks,
  savePeopleLink,
  removePeopleLink,
  showDialog,
  showError,
  showSuccess,
}) {
  const canManage = useMemo(() => canManageFranchiseLinks(appType), [appType]);
  const companyIri = useMemo(() => toPeopleIri(client), [client]);
  const [availableCandidates, setAvailableCandidates] = useState([]);
  const [linkedNormalized, setLinkedNormalized] = useState([]);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingManageLink, setEditingManageLink] = useState(null);
  const [manageForm, setManageForm] = useState({
    linkedIri: '',
    linkType: 'franchisee',
  });
  const [isManageSaving, setIsManageSaving] = useState(false);

  useEffect(() => {
    setLinkedNormalized(
      (Array.isArray(links) ? links : [])
        .map(item => normalizeFranchiseLink(item))
        .filter(Boolean),
    );
  }, [links]);

  useEffect(() => {
    let cancelled = false;
    if (!canManage || !peopleActions?.getItems) {
      setAvailableCandidates([]);
      return undefined;
    }
    // PJ candidates only
    peopleActions
      .getItems({
        peopleType: 'J',
        itemsPerPage: 100,
      })
      .then(response => {
        if (!cancelled) {
          const items = Array.isArray(response)
            ? response
            : normalizeCollection(response);
          // Exclude current client itself
          setAvailableCandidates(
            items.filter(
              item => extractId(item?.id || item?.['@id']) !== String(clientId),
            ),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setAvailableCandidates([]);
      });
    return () => {
      cancelled = true;
    };
  }, [canManage, peopleActions, clientId]);

  const franchiseOptions = useMemo(
    () =>
      buildAvailableFranchiseOptions({
        candidates: availableCandidates,
        linkedItems: linkedNormalized,
        editingLink: editingManageLink,
      }),
    [availableCandidates, linkedNormalized, editingManageLink],
  );

  const openManageModal = useCallback(link => {
    setEditingManageLink(link || null);
    setManageForm({
      linkedIri: link?.linkedIri || '',
      linkType: link?.linkType || 'franchisee',
    });
    setShowManageModal(true);
  }, []);

  const closeManageModal = useCallback(() => {
    setShowManageModal(false);
    setEditingManageLink(null);
  }, []);

  const reloadLinks = useCallback(async () => {
    if (!getPeopleLinks || !clientId) {
      return;
    }
    const response = await getPeopleLinks(buildFranchiseLinkReadParams(clientId));
    const next = buildFranchiseLinksFromPeopleLinks(response, {
      companyId: clientId,
    });
    setLinks(next);
  }, [getPeopleLinks, clientId, setLinks]);

  const handleManageSave = useCallback(async () => {
    if (!savePeopleLink || !companyIri) {
      showError?.('Não foi possível salvar o vínculo neste momento.');
      return;
    }
    const payload = buildFranchiseSavePayload({
      editingLink: editingManageLink,
      formData: manageForm,
      companyIri,
    });
    if (!payload) {
      showError?.('Selecione uma pessoa jurídica e o tipo de vínculo.');
      return;
    }
    setIsManageSaving(true);
    try {
      await savePeopleLink(payload);
      showSuccess?.(
        editingManageLink
          ? 'Vínculo atualizado com sucesso!'
          : 'Vínculo criado com sucesso!',
      );
      closeManageModal();
      setIsLoading?.(true);
      await reloadLinks();
    } catch {
      showError?.(
        editingManageLink
          ? 'Não foi possível atualizar o vínculo.'
          : 'Não foi possível criar o vínculo.',
      );
    } finally {
      setIsManageSaving(false);
      setIsLoading?.(false);
    }
  }, [
    savePeopleLink,
    companyIri,
    editingManageLink,
    manageForm,
    showError,
    showSuccess,
    closeManageModal,
    setIsLoading,
    reloadLinks,
  ]);

  const handleManageDelete = useCallback(
    link => {
      if (!link?.id || !removePeopleLink) {
        showError?.('Não foi possível identificar o vínculo para remover.');
        return;
      }
      showDialog?.({
        title: 'Remover vínculo',
        message: 'Deseja realmente remover este vínculo de franquia/filial?',
        confirmLabel: 'Remover',
        cancelLabel: 'Cancelar',
        onConfirm: async () => {
          try {
            await removePeopleLink(link.id);
            showSuccess?.('Vínculo removido com sucesso!');
            setLinks(prev =>
              (prev || []).filter(
                item => extractId(item?.id) !== extractId(link.id),
              ),
            );
          } catch {
            showError?.('Não foi possível remover o vínculo.');
          }
        },
      });
    },
    [removePeopleLink, showDialog, showError, showSuccess, setLinks],
  );

  return {
    canManage,
    linkedNormalized,
    showManageModal,
    editingManageLink,
    manageForm,
    setManageForm,
    isManageSaving,
    franchiseOptions,
    openManageModal,
    closeManageModal,
    handleManageSave,
    handleManageDelete,
  };
}

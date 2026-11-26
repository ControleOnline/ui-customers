export const inlineStyle_265_6 = {
  justifyContent: 'flex-end',
};

export const inlineStyle_266_12 = {
  backgroundColor: '#fff',
  borderTopLeftRadius: 24,
  borderTopRightRadius: 24,
  maxHeight: '80%',
  width: '100%',
  shadowColor: '#000',

  shadowOffset: {
    width: 0,
    height: -4,
  },

  shadowOpacity: 0.1,
  shadowRadius: 12,
  elevation: 10,
};

export const inlineStyle_279_14 = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 24,
  paddingVertical: 20,
  borderBottomWidth: 1,
  borderBottomColor: '#F1F5F9',
};

export const inlineStyle_288_16 = {
  fontSize: 20,
  fontWeight: '700',
  color: '#0F172A',
};

export const inlineStyle_291_49 = {
  width: 32,
  height: 32,
  borderRadius: 16,
  backgroundColor: '#F1F5F9',
  alignItems: 'center',
  justifyContent: 'center',
};

export const inlineStyle_299_10 = {
  padding: 24,
};

export const inlineStyle_302_16 = {
  marginBottom: 20,
};

export const inlineStyle_303_18 = {
  fontSize: 16,
  fontWeight: '600',
  color: '#212529',
  marginBottom: 8,
};

export const inlineStyle_304_18 = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
};

export const inlineStyle_308_18 = (
  {
    formData: formData,
    type: type,
  },
) => ({
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: formData.type === type['@id'] ? '#007bff' : '#dee2e6',
  backgroundColor: formData.type === type['@id'] ? '#e7f3ff' : '#f8f9fa',
});

export const inlineStyle_314_24 = (
  {
    formData: formData,
    type: type,
  },
) => ({
  fontSize: 14,
  color: formData.type === type['@id'] ? '#007bff' : '#64748B',
  fontWeight: formData.type === type['@id'] ? '600' : '400',
});

export const inlineStyle_324_16 = {
  marginBottom: 24,
};

export const inlineStyle_325_18 = {
  fontSize: 16,
  fontWeight: '600',
  color: '#212529',
  marginBottom: 8,
};

export const inlineStyle_327_14 = {
  borderWidth: 1,
  borderColor: '#e9ecef',
  borderRadius: 12,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  backgroundColor: '#f8f9fa',
};

export const inlineStyle_341_16 = {
  flexDirection: 'row',
  gap: 12,
};

export const inlineStyle_343_14 = {
  flex: 1,
  paddingVertical: 14,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: '#64748B',
  alignItems: 'center',
};

export const inlineStyle_350_20 = {
  fontSize: 16,
  fontWeight: '600',
  color: '#64748B',
};

export const attachmentListStyle = {
  marginTop: 8,
  gap: 8,
};

export const attachmentHeaderStyle = {
  marginBottom: 4,
};

export const attachmentSubtextStyle = {
  fontSize: 12,
  color: '#64748B',
  fontWeight: '600',
};

export const emptyAttachmentTextStyle = {
  fontSize: 13,
  color: '#94A3B8',
  marginVertical: 4,
};

export const attachmentCardStyle = {
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 10,
  padding: 10,
  backgroundColor: '#F8FAFC',
  marginBottom: 6,
};

export const attachmentMetaStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
  marginBottom: 6,
};

export const attachmentNameStyle = {
  fontSize: 14,
  color: '#0F172A',
  fontWeight: '600',
};

export const attachmentActionsStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 6,
};

export const attachmentActionButtonStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 4,
  paddingHorizontal: 8,
  paddingVertical: 6,
  borderRadius: 8,
  backgroundColor: '#EEF2FF',
};

export const attachmentActionLabelStyle = {
  fontSize: 12,
  color: '#334155',
  fontWeight: '500',
};

export const previewBackdropStyle = {
  flex: 1,
  backgroundColor: 'rgba(15, 23, 42, 0.55)',
  justifyContent: 'center',
  alignItems: 'center',
  padding: 16,
};

export const previewCardStyle = {
  backgroundColor: '#fff',
  borderRadius: 16,
  width: '100%',
  maxWidth: 640,
  maxHeight: '90%',
  overflow: 'hidden',
};

export const previewHeaderStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 16,
  paddingVertical: 12,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
};

export const previewTitleStyle = {
  flex: 1,
  fontSize: 16,
  fontWeight: '700',
  color: '#0F172A',
  marginRight: 12,
};

export const previewContentStyle = {
  padding: 16,
  alignItems: 'center',
};

export const previewImageStyle = {
  width: '100%',
  height: 360,
  maxHeight: 480,
};

export const previewFallbackStyle = {
  alignItems: 'center',
  gap: 12,
  paddingVertical: 24,
};

export const previewFallbackTextStyle = {
  fontSize: 14,
  color: '#64748B',
  textAlign: 'center',
};

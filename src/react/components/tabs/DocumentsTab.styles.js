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

export const inlineStyle_308_18 = ({ formData, type }) => ({
  paddingHorizontal: 16,
  paddingVertical: 10,
  borderRadius: 12,
  borderWidth: 1,
  borderColor: formData.type === type['@id'] ? '#007bff' : '#dee2e6',
  backgroundColor: formData.type === type['@id'] ? '#e7f3ff' : '#f8f9fa',
});

export const inlineStyle_314_24 = ({ formData, type }) => ({
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

export const inlineStyle_353_14 = {
  flex: 1,
  paddingVertical: 14,
  borderRadius: 12,
  backgroundColor: '#007bff',
  alignItems: 'center',
};

export const inlineStyle_360_20 = {
  fontSize: 16,
  fontWeight: '600',
  color: '#fff',
};

export const attachmentListStyle = {
  marginTop: 12,
  gap: 8,
};

export const attachmentCardStyle = {
  borderWidth: 1,
  borderColor: '#E2E8F0',
  borderRadius: 12,
  padding: 12,
  backgroundColor: '#F8FAFC',
  gap: 10,
};

export const attachmentHeaderStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
};

export const attachmentMetaStyle = {
  flex: 1,
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8,
};

export const attachmentNameStyle = {
  flex: 1,
  fontSize: 14,
  fontWeight: '600',
  color: '#0F172A',
};

export const attachmentSubtextStyle = {
  fontSize: 12,
  color: '#64748B',
  marginTop: 2,
};

export const attachmentActionsStyle = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
};

export const attachmentActionButtonStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 6,
  borderWidth: 1,
  borderColor: '#CBD5E1',
  borderRadius: 10,
  paddingHorizontal: 10,
  paddingVertical: 8,
  backgroundColor: '#FFFFFF',
};

export const attachmentActionLabelStyle = {
  fontSize: 12,
  fontWeight: '600',
  color: '#334155',
};

export const emptyAttachmentTextStyle = {
  fontSize: 13,
  color: '#64748B',
  marginTop: 8,
};

export const uploadButtonStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  marginTop: 12,
  borderWidth: 1,
  borderColor: '#BFDBFE',
  backgroundColor: '#EFF6FF',
  borderRadius: 12,
  paddingVertical: 10,
  paddingHorizontal: 12,
};

export const uploadButtonLabelStyle = {
  fontSize: 13,
  fontWeight: '600',
  color: '#2563EB',
};

export const previewBackdropStyle = {
  flex: 1,
  backgroundColor: 'rgba(15, 23, 42, 0.7)',
  justifyContent: 'center',
  padding: 20,
};

export const previewCardStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 20,
  overflow: 'hidden',
  maxHeight: '85%',
};

export const previewHeaderStyle = {
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'space-between',
  paddingHorizontal: 20,
  paddingVertical: 16,
  borderBottomWidth: 1,
  borderBottomColor: '#E2E8F0',
};

export const previewTitleStyle = {
  flex: 1,
  fontSize: 16,
  fontWeight: '700',
  color: '#0F172A',
};

export const previewContentStyle = {
  padding: 20,
  gap: 16,
};

export const previewImageStyle = {
  width: '100%',
  height: 260,
  borderRadius: 16,
  backgroundColor: '#E2E8F0',
};

export const previewFallbackStyle = {
  alignItems: 'center',
  justifyContent: 'center',
  paddingVertical: 32,
  gap: 12,
  borderWidth: 1,
  borderStyle: 'dashed',
  borderColor: '#CBD5E1',
  borderRadius: 16,
};

export const previewFallbackTextStyle = {
  fontSize: 14,
  color: '#475569',
  textAlign: 'center',
};

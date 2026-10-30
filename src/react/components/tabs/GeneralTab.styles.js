import {StyleSheet} from 'react-native';

export const createGeneralTabStyles = themeColors =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: themeColors.pageBackground,
    },
    content: {
      paddingBottom: 80,
    },
    fieldGroup: {
      marginBottom: 12,
    },
    fieldGroupLarge: {
      marginBottom: 16,
    },
    fieldLabel: {
      fontSize: 14,
      fontWeight: '600',
      color: themeColors.textSecondary,
      marginBottom: 6,
    },
    input: {
      borderWidth: 1,
      borderColor: themeColors.inputBorder,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingVertical: 10,
      fontSize: 15,
      color: themeColors.inputText,
      backgroundColor: themeColors.inputBackground,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: themeColors.inputBorder,
      borderRadius: 10,
      backgroundColor: themeColors.inputBackground,
    },
    inputIcon: {
      marginLeft: 10,
    },
    inputRowField: {
      flex: 1,
      paddingHorizontal: 10,
      paddingVertical: 10,
      fontSize: 15,
      color: themeColors.inputText,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: themeColors.inputBorder,
      borderRadius: 10,
      backgroundColor: themeColors.inputBackground,
      paddingHorizontal: 12,
      paddingVertical: 8,
    },
    switchLabel: {
      fontSize: 14,
      color: themeColors.textSecondary,
    },
    saveButton: {
      height: 42,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.buttonBackground,
      borderWidth: 1,
      borderColor: themeColors.buttonBorder || themeColors.buttonBackground,
    },
    uploadImageButton: {
      height: 42,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
      backgroundColor: themeColors.buttonBackground,
      borderWidth: 1,
      borderColor: themeColors.buttonBorder,
    },
    uploadImageButtonText: {
      color: themeColors.buttonText,
      fontSize: 15,
      fontWeight: '700',
    },
    saveButtonDisabled: {
      backgroundColor: themeColors.buttonBackgroundSecondary,
      borderWidth: 1,
      borderColor: themeColors.buttonBorderSecondary,
    },
    saveButtonText: {
      color: themeColors.buttonText,
      fontSize: 15,
      fontWeight: '700',
    },
    saveButtonTextDisabled: {
      color: themeColors.buttonTextSecondary,
    },
  });

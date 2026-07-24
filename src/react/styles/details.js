import {StyleSheet, Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

const resolvePalette = themeColors => ({
  headerBackground: themeColors.headerBackground,
  headerBorder: themeColors.headerBorder,
  headerText: themeColors.headerText,
  cardBackground: themeColors.cardBackground,
  cardBorder: themeColors.cardBorder,
  cardText: themeColors.cardText,
  cardIcon: themeColors.cardIcon,
  cardShadow: themeColors.cardShadow,
  listItemBackground: themeColors.listItemBackground,
  listItemText: themeColors.listItemText,
  listItemSubtitleText: themeColors.listItemSubtitleText,
  loadingSpinner: themeColors.loadingSpinner,
  buttonBackground: themeColors.buttonBackground,
  buttonBorder: themeColors.buttonBorder,
  buttonText: themeColors.buttonText,
  buttonShadow: themeColors.buttonShadow,
  buttonBackgroundSecondary: themeColors.buttonBackgroundSecondary,
  buttonBorderSecondary: themeColors.buttonBorderSecondary,
  buttonIconSecondary: themeColors.buttonIconSecondary,
  buttonTextSecondary: themeColors.buttonTextSecondary,
  buttonDisabledBackground: themeColors.buttonDisabledBackground,
  tabBarBackground: themeColors.tabBarBackground,
  tabBarBorder: themeColors.tabBarBorder,
  menuSelectedBorder: themeColors.menuSelectedBorder,
  menuSelectedText: themeColors.menuSelectedText,
  pageBackground: themeColors.pageBackground,
  modalOverlay: themeColors.modalOverlay,
  modalBackground: themeColors.modalBackground,
  modalText: themeColors.modalText,
  modalShadow: themeColors.modalShadow,
  inputBackground: themeColors.inputBackground,
  inputBorder: themeColors.inputBorder,
});

export const createDetailsStyles = themeColors => {
  const palette = resolvePalette(themeColors);

  return StyleSheet.create({
    // Header
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: palette.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: palette.headerBorder,
      elevation: 2,
      shadowColor: palette.cardShadow,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },

    avatar: {
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: palette.listItemBackground,
    },

    clientInfo: {
      flex: 1,
      marginLeft: 16,
    },

    clientName: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.headerText,
    },

    clientId: {
      color: palette.listItemSubtitleText,
      fontSize: 14,
      marginTop: 4,
    },

    // Botões de ação
    actionContainer: {
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: palette.headerBackground,
      borderBottomWidth: 1,
      borderBottomColor: palette.headerBorder,
    },

    editButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.buttonBackground,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: 12,
      gap: 8,
      elevation: 2,
      shadowColor: palette.buttonShadow,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },

    editButtonText: {
      color: palette.buttonText,
      fontSize: 16,
      fontWeight: '600',
    },

    editActions: {
      flexDirection: 'row',
      gap: 12,
    },

    iconButtonPrimary: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: palette.buttonBackground,
      alignItems: 'center',
      justifyContent: 'center',
    },

    iconButtonPrimaryIcon: {
      color: palette.buttonText,
    },

    iconButtonLocation: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: palette.buttonBackground,
      borderWidth: 2,
      borderColor: palette.buttonBorder,
      alignItems: 'center',
      justifyContent: 'center',
    },

    iconButtonGhost: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },

    iconButtonGhostIcon: {
      color: palette.cardIcon,
    },

    cardItemIcon: {
      color: palette.cardIcon,
    },

    cancelButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.buttonBackgroundSecondary,
      borderWidth: 1,
      borderColor: palette.buttonBorderSecondary,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
    },

    cancelButtonText: {
      color: palette.buttonTextSecondary,
      fontSize: 16,
      fontWeight: '500',
    },

    saveButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.buttonBackground,
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      gap: 8,
      elevation: 2,
      shadowColor: palette.buttonShadow,
      shadowOffset: {width: 0, height: 2},
      shadowOpacity: 0.2,
      shadowRadius: 4,
    },

    saveButtonDisabled: {
      backgroundColor: palette.buttonDisabledBackground,
      opacity: 0.6,
      elevation: 0,
      shadowOpacity: 0,
    },

    saveButtonText: {
      color: palette.buttonText,
      fontSize: 16,
      fontWeight: '600',
    },

    // Tab Bar
    tabBar: {
      flexDirection: 'row',
      backgroundColor: palette.tabBarBackground,
      borderBottomWidth: 1,
      borderBottomColor: palette.tabBarBorder,
      paddingHorizontal: 4,
    },

    tabItem: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      paddingVertical: 12,
      paddingHorizontal: 8,
      borderBottomWidth: 2,
      borderBottomColor: 'transparent',
    },

    tabItemActive: {
      borderBottomColor: palette.menuSelectedBorder,
    },

    tabLabel: {
      fontSize: 12,
      color: palette.buttonTextSecondary,
      marginTop: 4,
      textAlign: 'center',
    },

    tabLabelActive: {
      color: palette.menuSelectedText,
      fontWeight: '600',
    },

    // Scroll Container
    scrollContainer: {
      flex: 1,
      backgroundColor: palette.pageBackground,
    },

    scrollContent: {
      paddingBottom: 20,
    },

    // Tab Content
    tabContent: {
      width: '100%',
    },

    // Sections
    section: {
      backgroundColor: palette.cardBackground,
      marginHorizontal: 16,
      marginTop: 16,
      borderRadius: 12,
      padding: 16,
      elevation: 1,
      shadowColor: palette.cardShadow,
      shadowOffset: {width: 0, height: 1},
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },

    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 16,
    },

    sectionTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: palette.cardText,
    },

    // List Items
    listItem: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 12,
      paddingHorizontal: 16,
      backgroundColor: palette.listItemBackground,
      borderRadius: 8,
      marginBottom: 8,
    },

    itemContent: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      minWidth: 0,
    },

    listAvatar: {
      marginRight: 4,
    },

    listAvatarBrand: {
      backgroundColor: palette.buttonBackground,
      borderColor: palette.buttonText,
    },

    listAvatarText: {
      color: palette.buttonText,
    },

    locationButton: {
      alignSelf: 'flex-start',
    },

    itemText: {
      fontSize: 16,
      color: palette.listItemText,
      fontWeight: '500',
      flexShrink: 1,
    },

    itemSubtext: {
      fontSize: 14,
      color: palette.listItemSubtitleText,
      marginTop: 2,
    },

    itemActions: {
      flexDirection: 'row',
      gap: 12,
    },

    itemChevronIcon: {
      color: palette.listItemSubtitleText,
    },

    emptyText: {
      color: palette.listItemSubtitleText,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: 24,
      fontSize: 16,
    },

    loadingIndicator: {
      color: palette.loadingSpinner,
    },

    // Modal
    modalOverlay: {
      flex: 1,
      backgroundColor: palette.modalOverlay,
      justifyContent: 'center',
      alignItems: 'center',
    },

    modalContainer: {
      backgroundColor: palette.modalBackground,
      borderRadius: 16,
      padding: 24,
      width: width - 40,
      maxWidth: 400,
      elevation: 8,
      shadowColor: palette.modalShadow,
      shadowOffset: {width: 0, height: 4},
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },

    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.modalText,
      marginBottom: 20,
      textAlign: 'center',
    },

    modalInput: {
      borderWidth: 1,
      borderColor: palette.inputBorder,
      borderRadius: 8,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 16,
      marginBottom: 16,
      backgroundColor: palette.inputBackground,
    },

    label: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.modalText,
      marginBottom: 8,
    },

    pickerContainer: {
      marginBottom: 16,
    },

    pickerButtons: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 8,
    },

    pickerButton: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: palette.inputBorder,
      backgroundColor: palette.listItemBackground,
    },

    pickerButtonActive: {
      backgroundColor: palette.buttonBackground,
      borderColor: palette.buttonBackground,
    },

    pickerButtonText: {
      fontSize: 14,
      color: palette.buttonTextSecondary,
    },

    pickerButtonTextActive: {
      color: palette.buttonText,
      fontWeight: '600',
    },

    modalActions: {
      flexDirection: 'row',
      gap: 12,
      marginTop: 8,
    },

    modalCancelButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: palette.buttonBackgroundSecondary,
      borderWidth: 1,
      borderColor: palette.buttonBorderSecondary,
      alignItems: 'center',
    },

    modalCancelText: {
      color: palette.buttonTextSecondary,
      fontSize: 16,
      fontWeight: '500',
    },

    modalSaveButton: {
      flex: 1,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: 8,
      backgroundColor: palette.buttonBackground,
      alignItems: 'center',
    },

    modalSaveText: {
      color: palette.buttonText,
      fontSize: 16,
      fontWeight: '600',
    },

    navigationModalDescription: {
      fontSize: 15,
      color: palette.listItemSubtitleText,
      textAlign: 'center',
      marginBottom: 16,
    },

    navigationAddressCard: {
      borderWidth: 1,
      borderColor: palette.cardBorder,
      borderRadius: 12,
      padding: 16,
      backgroundColor: palette.listItemBackground,
      marginBottom: 16,
    },

    navigationAddressTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.cardText,
    },

    navigationAddressSubtitle: {
      fontSize: 14,
      color: palette.listItemSubtitleText,
      marginTop: 4,
    },

    navigationOptions: {
      gap: 12,
      marginBottom: 16,
    },

    navigationOptionButton: {
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 10,
      backgroundColor: palette.buttonBackgroundSecondary,
      borderWidth: 1,
      borderColor: palette.buttonBorderSecondary,
      alignItems: 'center',
    },

    navigationOptionButtonPrimary: {
      backgroundColor: palette.buttonBackground,
      borderColor: palette.buttonBackground,
    },

    navigationOptionButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.cardText,
    },

    navigationOptionButtonTextPrimary: {
      color: palette.buttonText,
    },

    // Error state
    retryButton: {
      backgroundColor: palette.buttonBackground,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderRadius: 8,
      marginTop: 16,
    },

    retryButtonText: {
      color: palette.buttonText,
      fontSize: 16,
      fontWeight: '600',
    },
  });
};

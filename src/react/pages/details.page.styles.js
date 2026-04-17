import { StyleSheet } from 'react-native';
import { colors } from '@controleonline/../../src/styles/colors';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerProfile: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F8FAFC',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  profileName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
    textAlign: 'center',
    maxWidth: '86%',
  },
  profileId: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  tabsHeader: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
    position: 'relative',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  tabButtonTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: '60%',
    height: 3,
    backgroundColor: colors.primary,
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  contentContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  tabPane: {
    height: '100%',
  },
  tabScroll: {
    flex: 1,
  },
  skeletonContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  skeletonCircle: {
    backgroundColor: '#E2E8F0',
  },
  skeletonLine: {
    backgroundColor: '#E2E8F0',
    borderRadius: 8,
  },
  skeletonTab: {
    flex: 1,
    height: 36,
    marginHorizontal: 8,
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
  },
  skeletonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
});

export default styles;

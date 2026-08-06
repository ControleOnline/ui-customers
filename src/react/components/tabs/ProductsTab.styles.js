import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionHeaderCopy: {
    flex: 1,
    minWidth: 0,
    paddingRight: 12,
  },
  sectionSubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: '#64748B',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    backgroundColor: '#2563EB',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptyState: {
    marginTop: 4,
  },
  emptyActionButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  emptyActionButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  card: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    backgroundColor: '#FFFFFF',
    marginTop: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
    minWidth: 0,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  cardSubtitle: {
    marginTop: 2,
    fontSize: 13,
    color: '#64748B',
  },
  badgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  primaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#DBEAFE',
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1D4ED8',
  },
  secondaryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: '#F1F5F9',
  },
  secondaryBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  metaWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  metaPill: {
    minWidth: 112,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
  },
  metaLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  metaValue: {
    marginTop: 3,
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
});

export default styles;

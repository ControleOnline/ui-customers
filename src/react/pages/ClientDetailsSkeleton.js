import React from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import styles from './details.page.styles';

/**
 * Loading skeleton for ClientDetails — extracted to keep details.js under 500 lines.
 */
const ClientDetailsSkeleton = ({ tabs = [] }) => (
  <SafeAreaView style={styles.container} edges={['bottom']}>
    <View style={styles.headerProfile}>
      <View
        style={[
          styles.skeletonCircle,
          { width: 64, height: 64, borderRadius: 32, marginBottom: 12 },
        ]}
      />
      <View
        style={[
          styles.skeletonLine,
          { width: 180, height: 22, marginBottom: 8 },
        ]}
      />
      <View style={[styles.skeletonLine, { width: 90, height: 12 }]} />
    </View>

    <View style={styles.tabsHeader}>
      {tabs.map(tab => (
        <View key={`skeleton-${tab.key}`} style={styles.skeletonTab} />
      ))}
    </View>

    <View style={styles.skeletonContent}>
      <View style={styles.skeletonCard}>
        <View
          style={[
            styles.skeletonLine,
            { width: '48%', height: 18, marginBottom: 14 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { width: '100%', height: 14, marginBottom: 10 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { width: '90%', height: 14, marginBottom: 10 },
          ]}
        />
        <View style={[styles.skeletonLine, { width: '82%', height: 14 }]} />
      </View>
      <View style={styles.skeletonCard}>
        <View
          style={[
            styles.skeletonLine,
            { width: '52%', height: 18, marginBottom: 14 },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            {
              width: '100%',
              height: 46,
              borderRadius: 10,
              marginBottom: 10,
            },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            { width: '100%', height: 46, borderRadius: 10 },
          ]}
        />
      </View>
    </View>
  </SafeAreaView>
);

export default ClientDetailsSkeleton;

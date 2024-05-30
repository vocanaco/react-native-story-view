import React from 'react';
import { Linking, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Colors } from '../theme';
import { OverlayType } from './types';

const Overlay = ({ item }: OverlayType) => (
  <TouchableOpacity
    style={styles.overlayView}
    onPress={() => {
      if (item.link) {
        Linking.openURL(item.link);
      }
    }}>
    <Text style={styles.overlayText}>View More...</Text>
  </TouchableOpacity>
);

export default Overlay;

const styles = StyleSheet.create({
  overlayView: {
    padding: 10,
    backgroundColor: Colors.darkGrey,
    borderRadius: 10
  },
  overlayText: {
    color: Colors.white
  }
});

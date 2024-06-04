import { Platform, StyleSheet } from 'react-native';
import { Colors, Metrics, moderateScale } from '../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: moderateScale(40),
    backgroundColor: Colors.black,
  },
  rootViewStyle: {
    flex: 1,
    backgroundColor: Colors.transparent,
  },
  mainFlashListContainer: {
    height: '100%',
    width: Metrics.windowWidth,
  },
  itemContainer: {
    flex: 1,
    paddingTop: Platform.OS == 'android' ? moderateScale(30) : 0,
  },
  touchContainer: {
    flex: 1,
  },
  list: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  loaderStyle: {
    flex: 1,
    alignSelf: 'center',
  },
});

export default styles;

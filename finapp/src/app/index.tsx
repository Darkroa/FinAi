import { StyleSheet, View, StatusBar, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

function WebViewScreen() {
  const insets = useSafeAreaInsets();

  // Replace this placeholder with your actual combined Replit URL
  const sharedReplitUrl = "https://690c3950-bc1c-414a-8c30-33fdc424a680-00-2j2a25zm90np6.spock.replit.dev/login"; 

  return (
    <View style={[
      styles.container, 
      { paddingTop: Platform.OS === 'ios' ? insets.top : StatusBar.currentHeight }
    ]}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <WebView 
        source={{ uri: sharedReplitUrl }} 
        style={styles.webview}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        originWhitelist={['*']}
        allowsInlineMediaPlayback={true} 
      />
    </View>
  );
}

export default function HomeScreen() {
  return (
    <SafeAreaProvider>
      <WebViewScreen />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  webview: {
    flex: 1,
  },
});

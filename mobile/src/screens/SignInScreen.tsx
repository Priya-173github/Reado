import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

export default function SignInScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign In</Text>
      <Button title="Login" onPress={() => console.log('Login pressed')} />
      <Button title="Go to Main App (Temp bypass)" onPress={() => navigation.replace('MainTabs')} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
});

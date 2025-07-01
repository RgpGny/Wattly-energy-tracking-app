import { StyleSheet } from 'react-native';

const colors = {
  primary: '#4CAF50', // Yeşil ana renk
  background: '#f0f4f7', // Açık arka plan
  card: '#ffffff', // Beyaz kart rengi
  text: '#333333', // Koyu metin rengi
  button: '#4CAF50', // Düğme rengi
  buttonText: '#FFFFFF', // Düğme metin rengi
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 10,
    elevation: 4,
    padding: 20,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: colors.text,
  },
  button: {
    backgroundColor: colors.button,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: colors.buttonText,
    fontWeight: 'bold',
    fontSize: 16,
  },
  input: {
    height: 50,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 12,
    paddingHorizontal: 10,
    backgroundColor: '#fff', // Giriş arka plan rengi
  },
  label: {
    fontSize: 16,
    marginVertical: 10,
    fontWeight: '600', // Kalın metin
  },
  total: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    marginTop: 20,
  },
  
  // Yeni stil eklemeleri
  cihazContainer: {
    backgroundColor: colors.card,
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    elevation: 3,
  },
  cihazName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
  },
  cihazPower: {
    fontSize: 16,
    color: '#666',
  },
  cihazEnergy: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  totalEnergy: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
    color: colors.text,
  },
  swipeAction: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    height: '100%',
  },
});

export default styles;

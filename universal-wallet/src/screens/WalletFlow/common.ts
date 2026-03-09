import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#111214',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  title: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  subtitle: {
    color: '#aab0ba',
    fontSize: 14,
    marginBottom: 16,
  },
  row: {
    backgroundColor: '#1b1c1f',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2d33',
  },
  rowTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  rowSubTitle: {
    color: '#b8bec8',
    fontSize: 13,
    marginTop: 4,
  },
  actionButton: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#615fff',
    marginBottom: 10,
    alignItems: 'center',
  },
  actionButtonSecondary: {
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: '#2b2f38',
    marginBottom: 10,
    alignItems: 'center',
  },
  actionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  input: {
    borderRadius: 10,
    borderColor: '#3c4250',
    borderWidth: 1,
    color: '#ffffff',
    backgroundColor: '#1b1c1f',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
});

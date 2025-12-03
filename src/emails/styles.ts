const valueCell = {
  padding: '12px 0',
  fontSize: '14px',
  color: '#333',
  textAlign: 'right' as const,
};

export const styles = {
  main: {
    backgroundColor: '#f6f9fc',
    fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  },
  container: {
    justifyContent: 'start',
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    maxWidth: '600px',
  },
  logo: {
    margin: '0 auto',
  },
  h1: {
    color: '#333',
    fontSize: '32px',
    fontWeight: 'bold',
    margin: '0 0 40px',
    padding: '0 40px',
    textAlign: 'center' as const,
  },
  text: {
    color: '#333',
    fontSize: '16px',
    lineHeight: '26px',
    padding: '0 40px',
  },
  receiptDetails: {
    padding: '24px 40px',
  },
  tableStyle: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  labelCell: {
    padding: '12px 0',
    fontSize: '14px',
    color: '#666',
    fontWeight: '600',
  },  
  valueCell,
  amountCell: {
    ...valueCell,
    fontSize: '18px',
    fontWeight: 'bold',
    color: '#10b981',
  },
  buttonContainer: {
    padding: '24px 40px',
    textAlign: 'center' as const,
  },
  button: {
    backgroundColor: '#10b981',
    borderRadius: '5px',
    color: '#fff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 32px',
  },
  hr: {
    borderColor: '#e6ebf1',
    margin: '20px 0',
    marginLeft: '40px',
    marginRight: '40px',
  },
  footer: {
    color: '#8898aa',
    fontSize: '14px',
    lineHeight: '24px',
    padding: '0 40px',
  },
}

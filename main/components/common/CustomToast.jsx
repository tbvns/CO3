import Toast, { BaseToast, ErrorToast } from 'react-native-toast-message';

export default function CustomToast({ currentTheme}) {
    return (
      <Toast
        position="top"
        bottomOffset={20}
        config={{
          success: (props) => (
            <BaseToast
              {...props}
              style={{
                backgroundColor: currentTheme.cardBackground,
                borderLeftColor: '#4CAF50',
                borderColor: currentTheme.borderColor,
                borderWidth: 1,
              }}
              text1Style={{ color: currentTheme.textColor, fontSize: 16 }}
              text2Style={{ color: currentTheme.secondaryTextColor, fontSize: 14 }}
            />
          ),
          error: (props) => (
            <ErrorToast
              {...props}
              style={{
                backgroundColor: currentTheme.cardBackground,
                borderLeftColor: '#F44336',
                borderColor: currentTheme.borderColor,
                borderWidth: 1,
              }}
              text1Style={{ color: currentTheme.textColor, fontSize: 16 }}
              text2Style={{ color: currentTheme.secondaryTextColor, fontSize: 14 }}
            />
          ),
        }}
      />
    )
}
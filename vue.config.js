module.exports = {
    pwa: {
        name: 'Arnold',
        themeColor: '#208a20',
        msTileColor: '#28a745',
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'black',
        workboxOptions: {
            navigateFallback: 'index.html',
        }
    },
    // publicPath: process.env.NODE_ENV === 'production'
    //     ? '/arnold'
    //     : '/',
    chainWebpack: config => {
        config
            .plugin('html')
            .tap(args => {
                args[0].title = "Arnold";
                return args;
            })
    }
}
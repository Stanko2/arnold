module.exports = {
    pwa: {
        name: 'Arnold',
        themeColor: '#',
        msTileColor: '#28a745',
        appleMobileWebAppCapable: 'yes',
        appleMobileWebAppStatusBarStyle: 'black',
        workboxOptions: {
            navigateFallback: 'index.html',
        }
    },
    chainWebpack: config => {
        config
            .plugin('html')
            .tap(args => {
                args[0].title = "Arnold";
                return args;
            })
    }
}
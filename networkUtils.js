/**
 * 获取网络类型名称
 * @param {number} type 网络类型编号
 * @returns {string}
 */
export function getNetworkTypeName(type) {
	const typeMap = {
		0: '未知',
		1: 'WIFI',
		2: '2G',
		3: '3G',
		4: '4G',
		5: '以太网',
		6: 'VPN',
		7: '5G'
	};
	return typeMap[type] || `未知类型(${type})`;
}

/**
 * 检测VPN状态，返回VPN开启状态及详细信息
 * 仅支持APP-PLUS 安卓环境
 * @returns {{isVpnActive: boolean, details: string[]}}
 */
export function checkVPNStatus() {
	let result = {
		isVpnActive: false,
		details: []
	};

	if (plus.os.name === 'Android') {
		try {
			const Context = plus.android.importClass("android.content.Context");
			const ConnectivityManager = plus.android.importClass("android.net.ConnectivityManager");
			const NetworkCapabilities = plus.android.importClass("android.net.NetworkCapabilities");
			const main = plus.android.runtimeMainActivity();
			const manager = main.getSystemService(Context.CONNECTIVITY_SERVICE);
			const BuildVersion = plus.android.importClass("android.os.Build$VERSION");

			if (BuildVersion.SDK_INT >= 23) {
				const networks = manager.getAllNetworks();
				for (let i = 0; i < networks.length; i++) {
					const network = networks[i];
					const capabilities = manager.getNetworkCapabilities(network);
					const linkProperties = manager.getLinkProperties(network);

					if (capabilities && capabilities.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) {
						result.isVpnActive = true;
						result.details.push('✓ 检测到VPN传输层');
					}

					if (linkProperties) {
						const linkInfo = linkProperties.toString();
						result.details.push(`LinkProperties 信息: ${linkInfo}`);
						if (linkInfo.includes("tun") || linkInfo.includes("tap")) {
							result.isVpnActive = true;
							result.details.push('✓ LinkProperties 中检测到 VPN 接口');
						}
					}
				}
			}

			const activeInfo = manager.getActiveNetworkInfo();
			if (activeInfo) {
				result.details.push(`当前活动网络类型: ${activeInfo.getTypeName()}`);
				result.details.push(`子网络类型: ${activeInfo.getSubtypeName()}`);
				const extraInfo = activeInfo.getExtraInfo();
				if (extraInfo) {
					result.details.push(`额外网络信息: ${extraInfo}`);
				}
			}

		} catch (e) {
			result.details.push(`检测过程出错: ${e.message}`);
			console.error('VPN检测错误:', e);
		}
	}

	return result;
}

/**
 * 检测代理及VPN状态，组合网络信息字符串，展示检测结果
 */
export function checkProxyAndVPN() {
	// #ifdef APP-PLUS
	try {
		const isProxy = plus.networkinfo.isSetProxy();
		const networkType = plus.networkinfo.getCurrentType();
		let vpnInfo = checkVPNStatus();

		let networkInfo = '当前网络状态：\n';
		networkInfo += `系统代理：${isProxy ? '已开启' : '未开启'}\n`;
		networkInfo += `基础网络类型：${getNetworkTypeName(networkType)}\n`;
		networkInfo += `VPN状态：${vpnInfo.isVpnActive ? '已开启' : '未开启'}\n\n`;

		networkInfo += '详细信息：\n';
		vpnInfo.details.forEach((detail, index) => {
			if (detail.startsWith('LinkProperties')) {
				networkInfo += `\n接口 ${index + 1}:\n`;
				const interfaceMatch = detail.match(/InterfaceName: (\w+)/);
				const linkAddressMatch = detail.match(/LinkAddresses: \[(.*?)\]/);
				const dnsMatch = detail.match(/DnsAddresses: \[(.*?)\]/);
				const routesMatch = detail.match(/Routes: \[(.*?)\]/);
				const mtuMatch = detail.match(/MTU: (\d+)/);

				if (interfaceMatch) {
					const interfaceName = interfaceMatch[1];
					networkInfo += `- 接口名称: ${interfaceName}`;
					if (interfaceName.startsWith('tun') || interfaceName.startsWith('tap')) {
						networkInfo += ' (VPN接口)';
					}
					networkInfo += '\n';
				}

				if (linkAddressMatch) {
					networkInfo += '- IP地址:\n';
					linkAddressMatch[1].split(',').forEach(ip => {
						networkInfo += `  · ${ip.trim()}\n`;
					});
				}

				if (dnsMatch && dnsMatch[1].trim() !== '') {
					networkInfo += '- DNS服务器:\n';
					dnsMatch[1].split(',').forEach(dns => {
						networkInfo += `  · ${dns.trim()}\n`;
					});
				}

				if (mtuMatch) {
					networkInfo += `- MTU: ${mtuMatch[1]}\n`;
				}

				if (routesMatch) {
					networkInfo += '- 路由信息:\n';
					routesMatch[1].split(',').forEach(route => {
						networkInfo += `  · ${route.trim()}\n`;
					});
				}
			} else if (!detail.includes('is not a function')) {
				networkInfo += `${detail}\n`;
			}
		});

		console.log('原始VPN检测信息:', JSON.stringify(vpnInfo, null, 2));

		uni.showModal({
			title: '网络检测结果',
			content: networkInfo,
			showCancel: false
		});
	} catch (e) {
		uni.showModal({
			title: '检测失败',
			content: '检测网络设置时发生错误：' + e.message,
			showCancel: false
		});
	}
	// #endif

	// #ifndef APP-PLUS
	uni.showModal({
		title: '提示',
		content: '此功能仅在APP环境下可用',
		showCancel: false
	});
	// #endif
}
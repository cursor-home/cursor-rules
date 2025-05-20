import * as vscode from 'vscode';
import { window, commands, ViewColumn, workspace } from 'vscode';
import { getDefaultAIClient, CursorAIRequest, Message } from '../cursor/ai';

/**
 * 注册生成代码命令
 */
export const generateCodeCommand = commands.registerCommand('cursor-rules-assistant.generateCode', async () => {
	try {
		// 获取用户输入的提示
		const prompt = await window.showInputBox({
			prompt: '输入代码生成提示',
			placeHolder: '例如: 生成一个Node.js的HTTP服务器'
		});
		
		if (!prompt) {
			return;
		}
		
		// 获取当前活动编辑器的语言
		let language = 'javascript';
		if (window.activeTextEditor) {
			language = window.activeTextEditor.document.languageId;
		}
		
		// 显示进度条
		window.withProgress({
			location: { viewId: 'cursor-rules-assistant.configView' },
			title: '正在生成代码...',
			cancellable: false
		}, async () => {
			// 调用Cursor AI生成代码
			try {
				const client = getDefaultAIClient();
				await client.initialize();
				
				const options: CursorAIRequest = {
					prompt: prompt,
					language: language,
					maxTokens: 2048,
					temperature: 0.7
				};
				
				const response = await client.generateCode(options);
				
				if (!response.error) {
					// 创建一个新的编辑器显示生成的代码
					const document = await workspace.openTextDocument({
						content: response.code || '',
						language: language // 使用请求中指定的语言
					});
					await window.showTextDocument(document, ViewColumn.One, true);
					window.showInformationMessage('代码生成成功!');
				} else {
					vscode.window.showErrorMessage(`生成代码失败: ${response.error}`);
				}
			} catch (error: any) {
				vscode.window.showErrorMessage(`生成代码失败: ${error.message}`);
			}
		});
	} catch (error) {
		console.error('生成代码出错:', error);
		window.showErrorMessage(`生成代码出错: ${error instanceof Error ? error.message : String(error)}`);
	}
});

/**
 * 注册流式对话命令
 */
export const streamConversationCommand = commands.registerCommand('cursor-rules-assistant.streamConversation', async () => {
	try {
		// 获取用户输入的提示
		const prompt = await window.showInputBox({
			prompt: '输入对话提示',
			placeHolder: '例如: 请详细介绍一下TypeScript的泛型'
		});
		
		if (!prompt) {
			return;
		}
		
		// 创建输出面板
		const outputChannel = window.createOutputChannel('Cursor AI 对话');
		outputChannel.show(true);
		outputChannel.appendLine('🤖 开始流式对话...\n');
		outputChannel.appendLine(`👤 用户: ${prompt}\n`);
		outputChannel.appendLine('🤖 AI 助手:');
		
		// 调用流式API
		try {
			const client = getDefaultAIClient();
			await client.initialize();
			
			const request: CursorAIRequest = {
				prompt: prompt,
				model: 'claude-3-opus-20240229',
				temperature: 0.7,
				maxTokens: 4000,
				stream: true
			};
			
			// 显示进度指示器
			window.withProgress({
				location: vscode.ProgressLocation.Notification,
				title: '正在生成回复...',
				cancellable: false
			}, async (progress) => {
				try {
					// 发送流式请求
					const response = await client.completionStream(request);
					
					// 处理流式响应
					const reader = response.body?.getReader();
					if (!reader) {
						throw new Error('无法获取响应流');
					}
					
					const decoder = new TextDecoder();
					let fullText = '';
					
					while (true) {
						const { value, done } = await reader.read();
						if (done) {break;}
						
						const chunk = decoder.decode(value, { stream: true });
						const lines = chunk.split('\n');
						
						for (const line of lines) {
							if (line.startsWith('data: ')) {
								const data = line.substring(6);
								if (data === '[DONE]') {
									continue;
								}
								
								try {
									const jsonData = JSON.parse(data);
									if (jsonData.choices && jsonData.choices.length > 0) {
										const content = jsonData.choices[0]?.delta?.content || '';
										if (content) {
											outputChannel.append(content);
											fullText += content;
											
											// 更新进度
											progress.report({ message: `已接收 ${fullText.length} 个字符` });
										}
									}
								} catch (e) {
									// 忽略解析错误
									console.error('解析数据错误:', e);
								}
							}
						}
					}
					
					outputChannel.appendLine('\n\n✅ 回复完成');
				} catch (error) {
					outputChannel.appendLine(`\n\n❌ 错误: ${error instanceof Error ? error.message : String(error)}`);
					throw error;
				}
			});
		} catch (error: any) {
			outputChannel.appendLine(`\n\n❌ 错误: ${error.message}`);
			vscode.window.showErrorMessage(`流式对话失败: ${error.message}`);
		}
	} catch (error) {
		console.error('流式对话出错:', error);
		window.showErrorMessage(`流式对话出错: ${error instanceof Error ? error.message : String(error)}`);
	}
});

/**
 * 注册高级对话命令
 */
export const advancedConversationCommand = commands.registerCommand('cursor-rules-assistant.advancedConversation', async () => {
	try {
		// 创建和显示对话面板
		const outputChannel = window.createOutputChannel('Cursor AI 高级对话');
		outputChannel.show(true);
		outputChannel.appendLine('🤖 Cursor AI 高级对话助手\n');
		
		// 获取系统提示
		const systemPrompt = await window.showInputBox({
			prompt: '输入系统提示 (可选)',
			placeHolder: '例如: 你是一位精通TypeScript的专业助手',
			value: '你是一位精通编程的专业技术助手，擅长解决编程问题和回答技术问题。'
		});
		
		if (systemPrompt === undefined) {
			// 用户取消了操作
			return;
		}
		
		// 初始化对话历史
		const messages: Message[] = [];
		if (systemPrompt) {
			messages.push({ role: 'system', content: systemPrompt });
			outputChannel.appendLine(`🔧 系统指令: ${systemPrompt}\n`);
		}
		
		// 初始化AI客户端
		const client = getDefaultAIClient();
		await client.initialize();
		
		// 对话循环
		let continueDialog = true;
		while (continueDialog) {
			// 获取用户输入
			const userPrompt = await window.showInputBox({
				prompt: '输入你的问题 (输入"exit"退出对话)',
				placeHolder: '例如: 请解释一下JavaScript中的闭包概念'
			});
			
			if (!userPrompt || userPrompt.toLowerCase() === 'exit') {
				continueDialog = false;
				outputChannel.appendLine('\n🔚 对话已结束');
				break;
			}
			
			// 添加用户消息到历史
			messages.push({ role: 'user', content: userPrompt });
			outputChannel.appendLine(`👤 用户: ${userPrompt}\n`);
			outputChannel.appendLine('🤖 AI 助手:');
			
			try {
				// 准备请求参数
				const request: CursorAIRequest = {
					messages: [...messages], // 复制消息历史
					model: 'claude-3-opus-20240229',
					temperature: 0.7,
					maxTokens: 4000,
					prompt: '' // 提供一个空的prompt，真正的内容在messages中
				};
				
				// 显示进度指示器
				await window.withProgress({
					location: vscode.ProgressLocation.Notification,
					title: '正在生成回复...',
					cancellable: false
				}, async () => {
					// 发送请求
					const response = await client.completionNonStream(request);
					
					if (response.error) {
						outputChannel.appendLine(`\n❌ 错误: ${response.error}`);
						vscode.window.showErrorMessage(`生成回复失败: ${response.error}`);
					} else {
						const assistantResponse = response.response || '';
						outputChannel.appendLine(assistantResponse);
						outputChannel.appendLine('\n');
						
						// 添加助手回复到历史
						messages.push({ role: 'assistant', content: assistantResponse });
						
						// 显示token使用情况
						if (response.usage) {
							outputChannel.appendLine(`ℹ️ Token使用: 输入 ${response.usage.input}, 输出 ${response.usage.output}\n`);
						}
					}
				});
			} catch (error: any) {
				outputChannel.appendLine(`\n❌ 错误: ${error.message}\n`);
				vscode.window.showErrorMessage(`对话出错: ${error.message}`);
			}
		}
	} catch (error) {
		console.error('高级对话出错:', error);
		window.showErrorMessage(`高级对话出错: ${error instanceof Error ? error.message : String(error)}`);
	}
}); 
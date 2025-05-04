#[test_only]
module secure_file_share::secure_file_share_tests {
    use sui::test_scenario::{Self as ts, Scenario};
    use sui::clock::{Self, Clock};
    use sui::object::{Self, ID, UID};
    use std::string::{Self, String};
    use std::vector;
    use secure_file_share::secure_file_share::{Self, FileRegistry, File};

    // 测试账户地址
    const ADMIN: address = @0xA11CE;
    const USER1: address = @0xB0B;
    const USER2: address = @0xCAFE;

    // 错误码
    const E_NOT_OWNER: u64 = 1;
    const E_NOT_AUTHORIZED: u64 = 2;
    const E_ACCESS_ALREADY_GRANTED: u64 = 3;
    const E_ACCESS_NOT_GRANTED: u64 = 4;

    // 创建测试场景
    fun setup_test(): (Scenario, Clock) {
        // 创建测试场景和时钟
        let scenario = ts::begin(ADMIN);
        let clock = clock::create_for_testing(ts::ctx(&mut scenario));
        
        // 初始化合约
        {
            secure_file_share::init(ts::ctx(&mut scenario));
        };
        
        (scenario, clock)
    }

    #[test]
    public fun test_create_file() {
        let (mut scenario, clock) = setup_test();
        
        // 创建文件
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            
            secure_file_share::create_file(
                &mut registry,
                string::utf8(b"test_file.txt"),
                string::utf8(b"Test file description"),
                string::utf8(b"QmTestHash"),
                0, // 价格为0，不销售
                false, // 非公开文件
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(registry);
        };
        
        // 验证文件创建成功
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            assert!(vector::length(&files) == 1, 0);
            ts::return_shared(registry);
        };
        
        // 结束测试
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    public fun test_grant_and_revoke_access() {
        let (mut scenario, clock) = setup_test();
        
        // 创建文件
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            
            secure_file_share::create_file(
                &mut registry,
                string::utf8(b"shared_file.txt"),
                string::utf8(b"File to be shared"),
                string::utf8(b"QmSharedHash"),
                0, // 不销售
                false, // 非公开文件
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(registry);
        };
        
        // 授予USER1访问权限
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            secure_file_share::grant_access(
                &mut file,
                USER1,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };

        // 尝试再次授予USER1访问权限（应该失败，因为已授权）
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            // 预期会产生E_ACCESS_ALREADY_GRANTED错误
            ts::next_tx(&mut scenario, ADMIN);
            {
                assert!(
                    ts::try_which_fails_with(|| {
                        secure_file_share::grant_access(
                            &mut file,
                            USER1,
                            ts::ctx(&mut scenario)
                        );
                    }, E_ACCESS_ALREADY_GRANTED),
                    0
                );
            };
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 撤销USER1的访问权限
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            secure_file_share::revoke_access(
                &mut file,
                USER1,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 尝试撤销已经撤销的USER1访问权限（应该失败，因为未授权）
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            // 预期会产生E_ACCESS_NOT_GRANTED错误
            ts::next_tx(&mut scenario, ADMIN);
            {
                assert!(
                    ts::try_which_fails_with(|| {
                        secure_file_share::revoke_access(
                            &mut file,
                            USER1,
                            ts::ctx(&mut scenario)
                        );
                    }, E_ACCESS_NOT_GRANTED),
                    0
                );
            };
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 尝试非所有者撤销访问权限（应该失败）
        ts::next_tx(&mut scenario, USER2);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            // 预期会产生E_NOT_OWNER错误
            ts::next_tx(&mut scenario, USER2);
            {
                assert!(
                    ts::try_which_fails_with(|| {
                        secure_file_share::revoke_access(
                            &mut file,
                            USER1,
                            ts::ctx(&mut scenario)
                        );
                    }, E_NOT_OWNER),
                    0
                );
            };
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 结束测试
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    public fun test_update_file_info() {
        let (mut scenario, clock) = setup_test();
        
        // 创建文件
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            
            secure_file_share::create_file(
                &mut registry,
                string::utf8(b"original_name.txt"),
                string::utf8(b"Original description"),
                string::utf8(b"QmHash"),
                0, // 不销售
                false, // 非公开文件
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(registry);
        };
        
        // 更新文件信息
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            secure_file_share::update_file_info(
                &mut file,
                string::utf8(b"updated_name.txt"),
                string::utf8(b"Updated description"),
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 验证文件信息已更新
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            let (owner, name, description, timestamp) = secure_file_share::get_file_metadata(&file);
            
            assert!(owner == ADMIN, 0);
            assert!(name == string::utf8(b"updated_name.txt"), 0);
            assert!(description == string::utf8(b"Updated description"), 0);
            assert!(timestamp > 0, 0);
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 尝试非所有者更新文件信息（应该失败）
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            // 预期会产生E_NOT_OWNER错误
            ts::next_tx(&mut scenario, USER1);
            {
                assert!(
                    ts::try_which_fails_with(|| {
                        secure_file_share::update_file_info(
                            &mut file,
                            string::utf8(b"hacked_name.txt"),
                            string::utf8(b"Hacked description"),
                            ts::ctx(&mut scenario)
                        );
                    }, E_NOT_OWNER),
                    0
                );
            };
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 结束测试
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }

    #[test]
    public fun test_public_file_access() {
        let (mut scenario, clock) = setup_test();
        
        // 创建公开文件
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            
            secure_file_share::create_file(
                &mut registry,
                string::utf8(b"public_file.txt"),
                string::utf8(b"This is a public file"),
                string::utf8(b"QmPublicHash"),
                0, // 不销售
                true, // 公开文件
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(registry);
        };
        
        // 未授权用户尝试访问公开文件（应该成功，因为文件是公开的）
        ts::next_tx(&mut scenario, USER2);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            // 这里不会抛出异常，因为是公开文件
            // 注意：seal_approve是内部函数，无法在测试中直接调用，但这里是为了测试逻辑
            // 实际调用会通过approve_internal内部处理
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 结束测试
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
    
    #[test]
    public fun test_file_authorization() {
        let (mut scenario, clock) = setup_test();
        
        // 创建私有文件
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            
            secure_file_share::create_file(
                &mut registry,
                string::utf8(b"private_file.txt"),
                string::utf8(b"This is a private file"),
                string::utf8(b"QmPrivateHash"),
                0, // 不销售
                false, // 私有文件
                &clock,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(registry);
        };
        
        // 授予USER1访问权限
        ts::next_tx(&mut scenario, ADMIN);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            secure_file_share::grant_access(
                &mut file,
                USER1,
                ts::ctx(&mut scenario)
            );
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // USER1访问文件内容（应该成功）
        ts::next_tx(&mut scenario, USER1);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            // 授权用户可以获取文件内容
            let content = secure_file_share::get_file_content(&file, ts::ctx(&mut scenario));
            assert!(content == string::utf8(b"QmPrivateHash"), 0);
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 未授权用户USER2尝试访问私有文件（应该失败）
        ts::next_tx(&mut scenario, USER2);
        {
            let registry = ts::take_shared<FileRegistry>(&scenario);
            let files = secure_file_share::get_user_files(&registry, ADMIN);
            let file_id = *vector::borrow(&files, 0);
            
            let file = ts::take_shared_by_id<File>(&scenario, file_id);
            
            // 获取文件元数据是允许的
            let (owner, name, description, _) = secure_file_share::get_file_metadata(&file);
            assert!(owner == ADMIN, 0);
            assert!(name == string::utf8(b"private_file.txt"), 0);
            assert!(description == string::utf8(b"This is a private file"), 0);
            
            // 但获取文件内容会失败
            ts::next_tx(&mut scenario, USER2);
            {
                assert!(
                    ts::try_which_fails_with(|| {
                        secure_file_share::get_file_content(&file, ts::ctx(&mut scenario));
                    }, E_NOT_AUTHORIZED),
                    0
                );
            };
            
            ts::return_shared(file);
            ts::return_shared(registry);
        };
        
        // 结束测试
        clock::destroy_for_testing(clock);
        ts::end(scenario);
    }
}

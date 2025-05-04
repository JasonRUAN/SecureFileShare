module secure_file_share::secure_file_share {
    use sui::event;
    use sui::sui::SUI;
    use sui::table::{Self, Table};
    use std::string::String;
    use sui::coin;
    use sui::clock::{Self, Clock};
    use sui::balance::{Self, Balance};
    use secure_file_share::utils::is_prefix;

    const E_NOT_OWNER: u64 = 1;
    const E_NOT_AUTHORIZED: u64 = 2;
    const E_ACCESS_ALREADY_GRANTED: u64 = 3;
    const E_ACCESS_NOT_GRANTED: u64 = 4;
    const E_OWNER_NO_NEED_TO_BUY: u64 = 5;
    const E_GRANTEE_NO_NEED_TO_BUY: u64 = 6;
    const E_INSUFFICIENT_FUNDS: u64 = 7;
    const E_PUBLIC_FILE_NO_NEED_TO_BUY: u64 = 8;
    const E_PUBLIC_FILE_NO_NEED_TO_GRANT: u64 = 9;
    const E_PUBLIC_FILE_CANNOT_SET_PRICE: u64 = 10;
    const E_NOT_PUBLIC_FILE: u64 = 11;
    const E_OWNER_NO_NEED_TO_ADD: u64 = 12;
    const E_GRANTEE_NO_NEED_TO_ADD: u64 = 13;

    public struct File has key, store {
        id: UID,
        owner: address,
        name: String,
        description: String,
        file_blob_id: String,
        file_type: String,
        file_size: u64,
        price: u64, // unit: MIST, 1 MIST = 10^-9 SUI. 为0表示不支持购买，仅支持文件所有者授权分享
        is_encrypt: bool, // 若为true，则文件有加密
        created_at: u64,
        access_list: vector<address>,
        balance: Balance<SUI>
    }

    public struct FileRegistry has key {
        id: UID,
        files_by_owner: Table<address, vector<ID>>,
        shared_to_me_files: Table<address, vector<ID>>,
        market_files: vector<ID>,
        total_files: u64,
    }

    public struct EventFileCreated has copy, drop {
        file_id: ID,
        owner: address,
        name: String,
        created_at: u64,
        file_blob_id: String,
        file_type: String,
        file_size: u64,
        price: u64,
        is_encrypt: bool,
        grantee_addresses: vector<address>,
    }

    public struct EventAccessGranted has copy, drop {
        file_id: ID,
        owner: address,
        grantee_addresses: vector<address>,
    }

    public struct EventAccessRevoked has copy, drop {
        file_id: ID,
        owner: address,
        revokee: address,
    }

    public struct EventFileBought has copy, drop {
        file_id: ID,
        owner: address,
        buyer: address,
        price: u64,
    }

    public struct EventFileAdded has copy, drop {
        file_id: ID,
        owner: address,
        buyer: address,
    }

    public struct EventFileWithdrawn has copy, drop {
        file_id: ID,
        owner: address,
        amount: u64,
    }

    fun init(ctx: &mut TxContext) {
        let registry = FileRegistry {
            id: object::new(ctx),
            files_by_owner: table::new(ctx),
            shared_to_me_files: table::new(ctx),
            market_files: vector::empty(),
            total_files: 0,
        };
        transfer::share_object(registry);
    }

    public entry fun create_file(
        registry: &mut FileRegistry,
        name: String,
        description: String,
        file_blob_id: String,
        file_type: String,
        file_size: u64,
        price: u64,
        is_encrypt: bool,
        grantee_addresses: vector<address>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 创建文件对象
        let file_uid = object::new(ctx);
        let file_id = object::uid_to_inner(&file_uid);

        let owner = ctx.sender();

        // 若是公开文件，则不能设置价格
        assert!(
            (price == 0 && !is_encrypt) || is_encrypt,
            E_PUBLIC_FILE_CANNOT_SET_PRICE
        );

        let mut file = File {
            id: file_uid,
            owner,
            name,
            description,
            file_blob_id,
            file_type,
            file_size,
            price,
            is_encrypt,
            created_at: clock::timestamp_ms(clock),
            access_list: vector::empty(),
            balance: balance::zero(),
        };

        // 更新注册表
        if (!table::contains(&registry.files_by_owner, owner)) {
            table::add(
                &mut registry.files_by_owner,
                owner,
                vector::empty()
            );
        };

        let owner_files = table::borrow_mut(&mut registry.files_by_owner, owner);
        vector::push_back(owner_files, file_id);

        // 如果文件有设置价格，加入市场
        // 或者，如果文件没有加密，认为是公开文件，直接加入市场，用户直接可以获取
        if (price > 0 || !is_encrypt) {
            vector::push_back(&mut registry.market_files, file_id);
        };

        // 增加计数器
        registry.total_files = registry.total_files + 1;

        let address_count = vector::length(&grantee_addresses);
        let mut i = 0_u64;
        while (i < address_count) {
            let grantee_address = grantee_addresses[i];
            vector::push_back(
                &mut file.access_list,
                grantee_address
            );

            // 添加到grantee的shared_to_me_files
            if (!table::contains(
                    &registry.shared_to_me_files,
                    grantee_address
                )) {
                table::add(
                    &mut registry.shared_to_me_files,
                    grantee_address,
                    vector::empty()
                );
            };

            let grantee_shared_files = table::borrow_mut(
                &mut registry.shared_to_me_files,
                grantee_address
            );

            if (!vector::contains(grantee_shared_files, &file_id)) {
                vector::push_back(grantee_shared_files, file_id);
            };

            i = i + 1;
        };

        event::emit(
            EventFileCreated {
                file_id,
                owner,
                name: file.name,
                created_at: file.created_at,
                file_blob_id: file.file_blob_id,
                file_type: file.file_type,
                file_size: file.file_size,
                price: file.price,
                is_encrypt,
                grantee_addresses,
            }
        );

        transfer::share_object(file);
    }

    // 授予访问权限
    public entry fun grant_access(
        registry: &mut FileRegistry,
        file: &mut File,
        grantee_addresses: vector<address>,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        assert!(sender == file.owner, E_NOT_OWNER);

        // 加密文件才需要授权
        assert!(
            file.is_encrypt,
            E_PUBLIC_FILE_NO_NEED_TO_GRANT
        );

        let file_id = object::uid_to_inner(&file.id);
        let address_count = vector::length(&grantee_addresses);
        let mut i = 0_u64;
        while (i < address_count) {
            let grantee_address = grantee_addresses[i];

            // 检查是否已经授权
            let (is_authorized, _) = vector::index_of(&file.access_list, &grantee_address);
            assert!(
                !is_authorized,
                E_ACCESS_ALREADY_GRANTED
            );

            // 添加到授权列表
            vector::push_back(
                &mut file.access_list,
                grantee_address
            );

            // 添加到grantee的shared_to_me_files
            if (!table::contains(
                    &registry.shared_to_me_files,
                    grantee_address
                )) {
                table::add(
                    &mut registry.shared_to_me_files,
                    grantee_address,
                    vector::empty()
                );
            };

            let grantee_shared_files = table::borrow_mut(
                &mut registry.shared_to_me_files,
                grantee_address
            );

            if (!vector::contains(grantee_shared_files, &file_id)) {
                vector::push_back(grantee_shared_files, file_id);
            };

            i = i + 1;
        };

        event::emit(
            EventAccessGranted {
                file_id,
                owner: file.owner,
                grantee_addresses,
            }
        );
    }

    // 撤销访问权限
    public entry fun revoke_access(
        registry: &mut FileRegistry,
        file: &mut File,
        from: address,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        assert!(sender == file.owner, E_NOT_OWNER);

        let file_id = object::uid_to_inner(&file.id);

        // 检查是否已授权
        let (is_authorized, idx) = vector::index_of(&file.access_list, &from);
        assert!(is_authorized, E_ACCESS_NOT_GRANTED);

        // 从授权列表移除
        vector::remove(&mut file.access_list, idx);

        // 从shared_to_me_files中移除
        if (table::contains(&registry.shared_to_me_files, from)) {
            let shared_files = table::borrow_mut(
                &mut registry.shared_to_me_files,
                from
            );
            let (contains, idx) = vector::index_of(shared_files, &file_id);
            if (contains) {
                vector::remove(shared_files, idx);
            };
        };

        event::emit(
            EventAccessRevoked {
                file_id,
                owner: file.owner,
                revokee: from,
            }
        );
    }

    public entry fun buy_file(
        registry: &mut FileRegistry,
        file: &mut File,
        payment_coin: &mut coin::Coin<SUI>,
        ctx: &mut TxContext
    ) {
        // 文件所有者无需购买
        let sender = ctx.sender();
        assert!(
            sender != file.owner,
            E_OWNER_NO_NEED_TO_BUY
        );

        // 已授权用户无需购买
        assert!(
            !file.access_list.contains(&sender),
            E_GRANTEE_NO_NEED_TO_BUY
        );

        // 加密文件才需要购买
        assert!(
            file.is_encrypt,
            E_PUBLIC_FILE_NO_NEED_TO_BUY
        );

        // 检查支付金额是否足够
        assert!(
            coin::value(payment_coin) >= file.price,
            E_INSUFFICIENT_FUNDS
        );

        let paid = payment_coin.split(file.price, ctx);
        coin::put(&mut file.balance, paid);

        // 添加到授权列表
        vector::push_back(&mut file.access_list, sender);

        // 添加到buyer的shared_to_me_files
        let file_id = object::uid_to_inner(&file.id);
        if (!table::contains(
                &registry.shared_to_me_files,
                sender
            )) {
            table::add(
                &mut registry.shared_to_me_files,
                sender,
                vector::empty()
            );
        };

        let buyer_shared_files = table::borrow_mut(
            &mut registry.shared_to_me_files,
            sender
        );

        if (!vector::contains(buyer_shared_files, &file_id)) {
            vector::push_back(buyer_shared_files, file_id);
        };

        event::emit(
            EventFileBought {
                file_id,
                owner: file.owner,
                buyer: sender,
                price: file.price,
            }
        );
    }

    // 公开文件可以直接添加
    public entry fun add_public_file(
        registry: &mut FileRegistry,
        file: &mut File,
        ctx: &mut TxContext
    ) {
        // 文件所有者无需购买
        let sender = ctx.sender();
        assert!(
            sender != file.owner,
            E_OWNER_NO_NEED_TO_ADD
        );

        // 已授权用户无需购买
        assert!(
            !file.access_list.contains(&sender),
            E_GRANTEE_NO_NEED_TO_ADD
        );

        // 公开文件才能添加
        assert!(!file.is_encrypt, E_NOT_PUBLIC_FILE);

        // 添加到授权列表
        vector::push_back(&mut file.access_list, sender);

        // 添加到buyer的shared_to_me_files
        let file_id = object::uid_to_inner(&file.id);
        if (!table::contains(
                &registry.shared_to_me_files,
                sender
            )) {
            table::add(
                &mut registry.shared_to_me_files,
                sender,
                vector::empty()
            );
        };

        let buyer_shared_files = table::borrow_mut(
            &mut registry.shared_to_me_files,
            sender
        );

        if (!vector::contains(buyer_shared_files, &file_id)) {
            vector::push_back(buyer_shared_files, file_id);
        };

        event::emit(
            EventFileAdded {
                file_id,
                owner: file.owner,
                buyer: sender,
            }
        );
    }

    public entry fun withdraw_balance(file: &mut File, ctx: &mut TxContext) {
        let sender = ctx.sender();
        assert!(sender == file.owner, E_NOT_OWNER);

        let amount = file.balance.value();

        let take_coin = coin::take(&mut file.balance, amount, ctx);
        transfer::public_transfer(take_coin, sender);

        event::emit(
            EventFileWithdrawn {
                file_id: object::uid_to_inner(&file.id),
                owner: file.owner,
                amount,
            }
        );
    }

    // 更新文件信息
    public entry fun update_file_info(
        file: &mut File,
        name: String,
        description: String,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        assert!(sender == file.owner, E_NOT_OWNER);

        file.name = name;
        file.description = description;
    }

    /// All allowlisted addresses can access all IDs with the prefix of the allowlist
    fun approve_internal(
        caller: address,
        id: vector<u8>,
        registry: &FileRegistry,
        file: &File
    ): bool {

        // Check if the id has the right prefix
        if (!is_prefix(registry.id.to_bytes(), id)) {
            return false
        };

        // 文件所有者可以直接解密文件并查看
        if (file.owner == caller) {
            return true
        };

        // 未加密文件无需授权，直接可见
        if (!file.is_encrypt) {
            return true
        };

        file.access_list.contains(&caller)
    }

    entry fun seal_approve(
        id: vector<u8>,
        registry: &FileRegistry,
        file: &File,
        ctx: &TxContext
    ) {

        assert!(
            approve_internal(ctx.sender(), id, registry, file),
            E_NOT_AUTHORIZED
        );
    }

    // 更新文件价格
    public entry fun update_file_price(
        registry: &mut FileRegistry,
        file: &mut File,
        price: u64,
        ctx: &mut TxContext
    ) {
        let sender = ctx.sender();
        assert!(sender == file.owner, E_NOT_OWNER);

        // 只有加密文件才能设置价格
        assert!(
            file.is_encrypt,
            E_PUBLIC_FILE_NO_NEED_TO_BUY
        );

        let file_id = object::uid_to_inner(&file.id);
        let old_price = file.price;
        file.price = price;

        // 根据价格变更更新market_files列表
        let (in_market, idx) = vector::index_of(&registry.market_files, &file_id);

        if (old_price == 0 && price > 0) {
            // 从非市场到市场
            if (!in_market) {
                vector::push_back(&mut registry.market_files, file_id);
            }
        }
        else if (old_price > 0 && price == 0) {
            // 从市场到非市场
            if (in_market) {
                vector::remove(&mut registry.market_files, idx);
            }
        }
    }
}
<!DOCTYPE html>
<html>
<head>
    <title>库存查询</title>
    <script src="https://unpkg.com/vue@3"></script>
    <script src="https://unpkg.com/@supabase/supabase-js@2"></script>
</head>
<body>
    <div id="app">
        <input v-model="searchKey" 
               placeholder="输入商品名称/SKU">
        <button @click="search">查询</button>
        
        <div v-if="result">
            <h2>{{ result.name }}</h2>
            <p>SKU: {{ result.sku }}</p>
            <p :class="{ 'low-stock': result.stock < 5 }">
                实时库存: {{ result.stock }}
            </p>
        </div>
    </div>

    <script>
        const supabase = createClient(
            "SUPABASE_URL",
            "SUPABASE_KEY"
        );

        const app = Vue.createApp({
            data() {
                return {
                    searchKey: '',
                    result: null
                }
            },
            methods: {
                async search() {
                    const { data } = await supabase
                        .from('products')
                        .select()
                        .or(`name.ilike.%${this.searchKey}%,sku.eq.${this.searchKey}`)
                        .limit(1);
                    
                    if(data.length > 0) {
                        this.result = data[0];
                        this.setupRealtime(data[0].id);
                    }
                },
                setupRealtime(productId) {
                    supabase
                        .channel('stock-change')
                        .on('postgres_changes', {
                            event: 'UPDATE',
                            schema: 'public',
                            table: 'products',
                            filter: `id=eq.${productId}`
                        }, payload => {
                            this.result.stock = payload.new.stock;
                        })
                        .subscribe();
                }
            }
        }).mount('#app');
    </script>
    
    <style>
        .low-stock { color: red; font-weight: bold; }
        input { padding: 8px; margin-right: 10px; }
        button { padding: 8px 16px; }
    </style>
</body>
</html>